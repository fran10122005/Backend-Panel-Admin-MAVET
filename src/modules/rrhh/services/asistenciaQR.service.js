const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return null;
  return Math.round(((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60)) * 100) / 100;
};

exports.registrarAsistencia = async (data) => {
  const { cedulaTrabajador, qr_uuid, tipoMovimiento } = data;

  const whereClause = {};
  if (qr_uuid) {
    whereClause.qr_uuid = qr_uuid;
  } else if (cedulaTrabajador) {
    whereClause.cedula = cedulaTrabajador;
  } else {
    throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);
  }

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
    case 'Entrada Mañana':
      asistencia.entrada_manana = dateObj;
      break;
    case 'Salida Mañana':
      asistencia.salida_manana = dateObj;
      break;
    case 'Entrada Tarde':
      asistencia.entrada_tarde = dateObj;
      break;
    case 'Salida Tarde':
      asistencia.salida_tarde = dateObj;
      break;
    default:
      throw new AppError('Tipo de movimiento inválido', 400);
  }

  const horasManana = calcularHoras(asistencia.entrada_manana, asistencia.salida_manana);
  const horasTarde = calcularHoras(asistencia.entrada_tarde, asistencia.salida_tarde);
  const total = (horasManana || 0) + (horasTarde || 0);
  asistencia.horas_cumplidas_dia = total > 0 ? total : null;

  await asistencia.save();
  return asistencia;
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
