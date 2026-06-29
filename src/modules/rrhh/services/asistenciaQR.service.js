const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const ORDEN_MOVIMIENTOS = ['Entrada', 'Salida'];
const CAMPO_MOVIMIENTO = {
  Entrada: 'entrada_manana',
  Salida: 'salida_manana',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resuelve el whereClause para buscar un trabajador dado:
 * - qr_uuid: puede ser un UUID real (campo qr_uuid) o una cédula (campo cedula)
 * - cedulaTrabajador: siempre busca por cedula
 */
const resolverWhereTrabajador = (qr_uuid, cedulaTrabajador) => {
  if (cedulaTrabajador) return { cedula: cedulaTrabajador };
  if (qr_uuid) {
    return UUID_REGEX.test(qr_uuid) ? { qr_uuid } : { cedula: qr_uuid }; // el QR contiene cédula en carnets sin qr_uuid
  }
  return null;
};

const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return null;
  const diffMs = new Date(fin) - new Date(inicio);
  const diffMinutos = Math.floor(diffMs / (1000 * 60)); // truncar a minutos exactos
  return Math.round((diffMinutos / 60) * 100) / 100; // guardar con 2 decimales para la BD
};

exports.registrarAsistencia = async (data) => {
  const { cedulaTrabajador, qr_uuid, tipoMovimiento } = data;

  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({ where: whereClause });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  // Usar hora del servidor
  const dateObj = new Date();

  // Ajuste para la zona horaria local de Venezuela (-04:00)
  // o simplemente usar toLocaleDateString('en-CA') que da YYYY-MM-DD
  const offset = dateObj.getTimezoneOffset() * 60000;
  const fecha = new Date(dateObj - offset).toISOString().split('T')[0];

  let asistencia = await AsistenciaQR.findOne({
    where: {
      id_trabajador: trabajador.id_trabajador,
      fecha,
    },
  });

  if (!asistencia) {
    asistencia = await AsistenciaQR.create({
      id_trabajador: trabajador.id_trabajador,
      fecha,
    });
  }
  switch (tipoMovimiento) {
    case 'Entrada':
      asistencia.entrada_manana = dateObj;
      break;
    case 'Salida':
      asistencia.salida_manana = dateObj;
      break;
    default:
      throw new AppError('Tipo de movimiento inválido', 400);
  }

  const horasManana = calcularHoras(asistencia.entrada_manana, asistencia.salida_manana);
  const total = horasManana || 0;
  asistencia.horas_cumplidas_dia = total > 0 ? total : null;

  await asistencia.save();
  return asistencia;
};

exports.getEstadoAsistencia = async ({ qr_uuid, cedulaTrabajador }) => {
  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({ where: whereClause });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const dateObj = new Date();
  const offset = dateObj.getTimezoneOffset() * 60000;
  const fecha = new Date(dateObj - offset).toISOString().split('T')[0];

  const asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador, fecha },
  });

  // Determinar el próximo movimiento a registrar
  let siguienteMovimiento = 'Entrada'; // sin registro hoy → primer movimiento
  if (asistencia) {
    siguienteMovimiento = null; // asume jornada completa; se sobreescribe si hay hueco
    for (const mov of ORDEN_MOVIMIENTOS) {
      if (!asistencia[CAMPO_MOVIMIENTO[mov]]) {
        siguienteMovimiento = mov;
        break;
      }
    }
  }

  let horasTranscurridas = null;
  let entradaActual = null;
  if (asistencia) {
    if (siguienteMovimiento === 'Salida' && asistencia.entrada_manana) {
      entradaActual = asistencia.entrada_manana;
      const diffMs = dateObj - new Date(asistencia.entrada_manana);
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      horasTranscurridas = diffMinutos / 60; // enviar fracción exacta de minutos
    }
  }

  return {
    trabajador: {
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      cedula: trabajador.cedula,
    },
    siguienteMovimiento,
    entradaActual,
    horasTranscurridas,
    asistencia: asistencia || null,
  };
};

exports.getAllAsistencias = async (page, limit) => {
  const query = {
    include: [
      {
        model: Trabajador,
        include: [{ model: CargoTrabajador }],
      },
    ],
    order: [['fecha', 'DESC']],
  };
  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await AsistenciaQR.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }
  return await AsistenciaQR.findAll(query);
};
