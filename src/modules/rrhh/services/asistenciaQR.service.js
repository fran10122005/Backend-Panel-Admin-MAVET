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
  if (cedulaTrabajador) {
    const cleanCedula = cedulaTrabajador.replace(/^[VEve]-?/g, '').replace(/\D/g, '');
    return { cedula: cleanCedula };
  }
  if (qr_uuid) {
    if (UUID_REGEX.test(qr_uuid)) {
      return { qr_uuid };
    } else {
      const cleanCedula = qr_uuid.replace(/^[VEve]-?/g, '').replace(/\D/g, '');
      return { cedula: cleanCedula };
    }
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
  const { cedulaTrabajador, qr_uuid, tipoMovimiento, observaciones } = data;

  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({ where: whereClause });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const dateObj = new Date();
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
      if (observaciones) asistencia.observaciones = observaciones;
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

exports.getSemanaAsistencia = async (cedulaTrabajador) => {
  const cleanCedula = cedulaTrabajador.replace(/^[VEve]-?/g, '').replace(/\D/g, '');
  const trabajador = await Trabajador.findOne({ where: { cedula: cleanCedula } });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const ahora = new Date();
  const diaSemana = ahora.getDay();
  const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(ahora);
  lunes.setDate(ahora.getDate() - diffLunes);
  const lunesStr = lunes.toISOString().split('T')[0];
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const domingoStr = domingo.toISOString().split('T')[0];

  const registros = await AsistenciaQR.findAll({
    where: {
      id_trabajador: trabajador.id_trabajador,
      fecha: { [require('sequelize').Op.between]: [lunesStr, domingoStr] },
    },
  });

  const horasAcumuladas = registros.reduce(
    (sum, r) => sum + (parseFloat(r.horas_cumplidas_dia) || 0),
    0
  );
  const horasSemanales = parseFloat(trabajador.horas_semanales) || 0;
  const horasRestantes = Math.max(0, horasSemanales - horasAcumuladas);

  return {
    horasSemanales,
    horasAcumuladas: Math.round(horasAcumuladas * 100) / 100,
    horasRestantes: Math.round(horasRestantes * 100) / 100,
    diasRegistrados: registros.length,
  };
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

exports.updateObservaciones = async (id, observaciones) => {
  const asistencia = await AsistenciaQR.findByPk(id);
  if (!asistencia) throw new AppError('Registro de asistencia no encontrado', 404);
  asistencia.observaciones = observaciones || null;
  await asistencia.save();
  return asistencia;
};

exports.getResumenSemanalTodos = async () => {
  const ahora = new Date();
  const diaSemana = ahora.getDay();
  const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(ahora);
  lunes.setDate(ahora.getDate() - diffLunes);
  const lunesStr = lunes.toISOString().split('T')[0];
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const domingoStr = domingo.toISOString().split('T')[0];

  const { Op } = require('sequelize');

  const trabajadores = await Trabajador.findAll({
    where: { estado: true },
    include: [{ model: CargoTrabajador }],
  });

  const registros = await AsistenciaQR.findAll({
    where: {
      fecha: { [Op.between]: [lunesStr, domingoStr] },
    },
    include: [{ model: Trabajador }],
  });

  const resumen = trabajadores.map((t) => {
    const tRegistros = registros.filter((r) => r.id_trabajador === t.id_trabajador);
    const horasAcumuladas = tRegistros.reduce(
      (sum, r) => sum + (parseFloat(r.horas_cumplidas_dia) || 0),
      0
    );
    const horasSemanales = parseFloat(t.horas_semanales) || 0;
    const horasRestantes = Math.max(0, horasSemanales - horasAcumuladas);
    const tieneObs = tRegistros.some((r) => r.observaciones);
    return {
      id_trabajador: t.id_trabajador,
      cedula: t.cedula,
      nombres: t.nombres,
      apellidos: t.apellidos,
      cargo: t.CargoTrabajador?.nombre_cargo || null,
      horas_semanales: horasSemanales,
      horas_acumuladas: Math.round(horasAcumuladas * 100) / 100,
      horas_restantes: horasRestantes <= 0 || tieneObs ? 0 : Math.round(horasRestantes * 100) / 100,
      cumplio: horasRestantes <= 0,
      justificado: !(horasRestantes <= 0) && tieneObs,
      observaciones: tRegistros.find((r) => r.observaciones)?.observaciones || null,
      dias: tRegistros.map((r) => ({
        id: r.id_asistencia,
        fecha: r.fecha,
        entrada: r.entrada_manana,
        salida: r.salida_manana,
        horas: r.horas_cumplidas_dia,
        observaciones: r.observaciones,
      })),
    };
  });

  return resumen;
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
