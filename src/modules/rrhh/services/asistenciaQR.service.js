const { AsistenciaQR, Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');

const getVenezuelaDateString = (dateObj) => {
  const vTime = new Date(dateObj.getTime() - 4 * 60 * 60 * 1000);
  return vTime.toISOString().split('T')[0];
};

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
    return { cedula: normalizeCedula(cedulaTrabajador) };
  }
  if (qr_uuid) {
    if (UUID_REGEX.test(qr_uuid)) {
      return { qr_uuid };
    } else {
      return { cedula: normalizeCedula(qr_uuid) };
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
  const fecha = getVenezuelaDateString(dateObj);

  let asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  switch (tipoMovimiento) {
    case 'Entrada':
      if (asistencia && !asistencia.salida_manana) {
        throw new AppError('Ya tiene una entrada abierta. Debe registrar salida primero.', 400);
      }
      if (asistencia && asistencia.fecha === fecha) {
        throw new AppError('La jornada de hoy ya fue completada.', 400);
      }
      asistencia = await AsistenciaQR.create({
        id_trabajador: trabajador.id_trabajador,
        fecha,
      });
      asistencia.entrada_manana = dateObj;
      break;
    case 'Salida':
      if (!asistencia || asistencia.salida_manana) {
        throw new AppError('No hay una entrada abierta para registrar salida.', 400);
      }
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
  const cedula = normalizeCedula(cedulaTrabajador);
  const trabajador = await Trabajador.findOne({ where: { cedula } });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const ahora = new Date();
  const fechaActualStr = getVenezuelaDateString(ahora);
  const fechaActual = new Date(fechaActualStr + 'T00:00:00');

  const diaSemana = fechaActual.getDay();
  const diffMiercoles = (diaSemana + 4) % 7;
  const miercoles = new Date(fechaActual);
  miercoles.setDate(fechaActual.getDate() - diffMiercoles);
  const inicioStr = miercoles.toISOString().split('T')[0];

  const martes = new Date(miercoles);
  martes.setDate(miercoles.getDate() + 6);
  const finStr = martes.toISOString().split('T')[0];

  const registros = await AsistenciaQR.findAll({
    where: {
      id_trabajador: trabajador.id_trabajador,
      fecha: { [require('sequelize').Op.between]: [inicioStr, finStr] },
    },
  });

  const horasAcumuladas = registros.reduce(
    (sum, r) =>
      sum + (parseFloat(r.horas_cumplidas_dia) || 0) + (parseFloat(r.horas_justificadas) || 0),
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
  const fecha = getVenezuelaDateString(dateObj);

  const asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  let siguienteMovimiento = 'Entrada';
  let recordToUse = null;

  if (asistencia) {
    if (!asistencia.salida_manana) {
      siguienteMovimiento = 'Salida';
      recordToUse = asistencia;
    } else {
      if (asistencia.fecha === fecha) {
        siguienteMovimiento = null;
        recordToUse = asistencia;
      } else {
        siguienteMovimiento = 'Entrada';
        recordToUse = null;
      }
    }
  }

  let horasTranscurridas = null;
  let entradaActual = null;

  if (recordToUse && siguienteMovimiento === 'Salida' && recordToUse.entrada_manana) {
    entradaActual = recordToUse.entrada_manana;
    const diffMs = dateObj - new Date(recordToUse.entrada_manana);
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    horasTranscurridas = diffMinutos / 60;
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
    asistencia: recordToUse || null,
  };
};

exports.updateObservaciones = async (id, observaciones, horas_justificadas) => {
  const asistencia = await AsistenciaQR.findByPk(id);
  if (!asistencia) throw new AppError('Registro de asistencia no encontrado', 404);
  asistencia.observaciones = observaciones || null;
  if (horas_justificadas !== undefined) {
    asistencia.horas_justificadas = horas_justificadas || null;
  }
  await asistencia.save();
  return asistencia;
};

exports.justificarSemana = async ({ cedula, observaciones, horas_justificadas }) => {
  const trabajador = await Trabajador.findOne({ where: { cedula, estado: true } });
  if (!trabajador) throw new AppError('Trabajador no encontrado o inactivo', 404);

  const dateObj = new Date();
  const fecha = getVenezuelaDateString(dateObj);

  let asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador, fecha },
  });

  if (!asistencia) {
    asistencia = await AsistenciaQR.create({
      id_trabajador: trabajador.id_trabajador,
      fecha,
      horas_cumplidas_dia: 0,
      horas_justificadas,
      observaciones: observaciones || null,
    });
  } else {
    asistencia.horas_justificadas =
      (parseFloat(asistencia.horas_justificadas) || 0) + parseFloat(horas_justificadas);
    if (observaciones) asistencia.observaciones = observaciones;
    await asistencia.save();
  }

  return asistencia;
};

exports.getResumenSemanalTodos = async () => {
  const ahora = new Date();
  const fechaActualStr = getVenezuelaDateString(ahora);
  const fechaActual = new Date(fechaActualStr + 'T00:00:00');

  const diaSemana = fechaActual.getDay();
  const diffMiercoles = (diaSemana + 4) % 7;
  const miercoles = new Date(fechaActual);
  miercoles.setDate(fechaActual.getDate() - diffMiercoles);
  const inicioStr = miercoles.toISOString().split('T')[0];

  const martes = new Date(miercoles);
  martes.setDate(miercoles.getDate() + 6);
  const finStr = martes.toISOString().split('T')[0];

  const { Op } = require('sequelize');

  const trabajadores = await Trabajador.findAll({
    where: { estado: true },
    include: [{ model: CargoTrabajador }],
  });

  const registros = await AsistenciaQR.findAll({
    where: {
      fecha: { [Op.between]: [inicioStr, finStr] },
    },
    include: [{ model: Trabajador }],
  });

  const resumen = trabajadores.map((t) => {
    const tRegistros = registros.filter((r) => r.id_trabajador === t.id_trabajador);
    const horasAcumuladas = tRegistros.reduce(
      (sum, r) =>
        sum + (parseFloat(r.horas_cumplidas_dia) || 0) + (parseFloat(r.horas_justificadas) || 0),
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
      horas_restantes: Math.round(horasRestantes * 100) / 100,
      cumplio: horasRestantes <= 0,
      justificado: tieneObs,
      observaciones: tRegistros.find((r) => r.observaciones)?.observaciones || null,
      dias: tRegistros.map((r) => ({
        id: r.id_asistencia,
        fecha: r.fecha,
        entrada: r.entrada_manana,
        salida: r.salida_manana,
        horas: r.horas_cumplidas_dia,
        observaciones: r.observaciones,
        horas_justificadas: r.horas_justificadas,
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
