const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { AsistenciaQR, Trabajador, CargoTrabajador, BitacoraAuditoria } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');

const PIN_MAX_INTENTOS = 3;
const PIN_BLOQUEO_MINUTOS = 5;
const PIN_TOKEN_EXPIRACION_MIN = 2;

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

  const trabajador = await Trabajador.findOne({
    where: whereClause,
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const isSecurity = trabajador.CargoTrabajador?.nombre_cargo === 'Seguridad / Vigilante';

  const dateObj = new Date();
  const fecha = getVenezuelaDateString(dateObj);

  let asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  switch (tipoMovimiento) {
    case 'Entrada':
      if (asistencia && !asistencia.salida_manana) {
        if (asistencia.fecha === fecha || isSecurity) {
          throw new AppError('Ya tiene una entrada abierta. Debe registrar salida primero.', 400);
        }
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
  const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(fechaActual);
  lunes.setDate(fechaActual.getDate() - diffLunes);
  const inicioStr = lunes.toISOString().split('T')[0];

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const finStr = domingo.toISOString().split('T')[0];

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

  const trabajador = await Trabajador.findOne({
    where: whereClause,
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const isSecurity = trabajador.CargoTrabajador?.nombre_cargo === 'Seguridad / Vigilante';

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
      if (asistencia.fecha === fecha || isSecurity) {
        siguienteMovimiento = 'Salida';
        recordToUse = asistencia;
      } else {
        siguienteMovimiento = 'Entrada';
        recordToUse = null;
      }
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
      id: trabajador.id_trabajador,
    },
    siguienteMovimiento,
    entradaActual,
    horasTranscurridas,
    tienePin: !!trabajador.pin_hash,
    usarFacial:
      !!trabajador.usarFacial &&
      (!!trabajador.descriptor_facial || trabajador.descriptores_faciales?.length > 0),
    descriptorFacial: trabajador.usarFacial ? trabajador.descriptor_facial : null,
    descriptoresFaciales: trabajador.usarFacial ? trabajador.descriptores_faciales : null,
    cantidadDescriptores:
      trabajador.descriptores_faciales?.length || (trabajador.descriptor_facial ? 1 : 0),
    asistencia: recordToUse || null,
  };
};

exports.verificarPin = async ({ qr_uuid, cedulaTrabajador, pin }, req = null) => {
  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({
    where: whereClause,
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  if (!trabajador.pin_hash) {
    throw new AppError('PIN no configurado. Contacte al departamento de RRHH.', 400);
  }

  const ahora = new Date();
  if (trabajador.pin_bloqueado_hasta && new Date(trabajador.pin_bloqueado_hasta) > ahora) {
    const minutosRestantes = Math.ceil((new Date(trabajador.pin_bloqueado_hasta) - ahora) / 60000);
    throw new AppError(
      `Demasiados intentos fallidos. Intente de nuevo en ${minutosRestantes} minuto(s).`,
      429
    );
  }

  const isMatch = await bcrypt.compare(pin, trabajador.pin_hash);
  if (!isMatch) {
    trabajador.pin_intentos_fallidos = (trabajador.pin_intentos_fallidos || 0) + 1;
    const intentosRestantes = PIN_MAX_INTENTOS - trabajador.pin_intentos_fallidos;

    if (trabajador.pin_intentos_fallidos >= PIN_MAX_INTENTOS) {
      trabajador.pin_bloqueado_hasta = new Date(ahora.getTime() + PIN_BLOQUEO_MINUTOS * 60000);
      await trabajador.save();
      await registrarAuditoria({
        tipo: 'pin_fallido',
        detalle: `PIN bloqueado tras ${PIN_MAX_INTENTOS} intentos fallidos - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})`,
        req,
      });
      throw new AppError(
        `PIN bloqueado temporalmente por ${PIN_BLOQUEO_MINUTOS} minutos debido a múltiples intentos fallidos.`,
        429
      );
    }

    await trabajador.save();
    await registrarAuditoria({
      tipo: 'pin_fallido',
      detalle: `PIN incorrecto - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula}) - intento ${trabajador.pin_intentos_fallidos}/${PIN_MAX_INTENTOS}`,
      req,
    });

    throw new AppError(`PIN incorrecto. Intentos restantes: ${intentosRestantes}`, 401);
  }

  trabajador.pin_intentos_fallidos = 0;
  trabajador.pin_bloqueado_hasta = null;
  await trabajador.save();

  const dateObj = new Date();
  const fecha = getVenezuelaDateString(dateObj);
  const isSecurity = trabajador.CargoTrabajador?.nombre_cargo === 'Seguridad / Vigilante';

  const asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  let siguienteMovimiento = 'Entrada';
  if (asistencia) {
    if (!asistencia.salida_manana) {
      if (asistencia.fecha === fecha || isSecurity) {
        siguienteMovimiento = 'Salida';
      }
    } else if (asistencia.fecha !== fecha) {
      siguienteMovimiento = 'Entrada';
    } else {
      siguienteMovimiento = null;
    }
  }

  const tokenPayload = {
    id_trabajador: trabajador.id_trabajador,
    tipoMovimiento: siguienteMovimiento,
    ts: dateObj.toISOString(),
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', {
    expiresIn: `${PIN_TOKEN_EXPIRACION_MIN}m`,
  });

  await registrarAuditoria({
    tipo: 'pin_exitoso',
    detalle: `PIN verificado correctamente - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})`,
    req,
  });

  return {
    valido: true,
    token,
    trabajador: {
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      cedula: trabajador.cedula,
      id: trabajador.id_trabajador,
    },
    siguienteMovimiento,
    serverTime: dateObj.toISOString(),
  };
};

exports.confirmarAsistencia = async (
  { tokenConfirmacion, dispositivo, coordenadas },
  req = null
) => {
  let decoded;
  try {
    decoded = jwt.verify(tokenConfirmacion, process.env.JWT_SECRET || 'secret');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(
        'El tiempo de confirmación ha expirado. Por favor, inicie el proceso nuevamente.',
        401
      );
    }
    throw new AppError('Token de confirmación inválido.', 401);
  }

  const { id_trabajador, tipoMovimiento } = decoded;
  if (!id_trabajador || !tipoMovimiento) {
    throw new AppError('Token de confirmación inválido.', 401);
  }

  const trabajador = await Trabajador.findByPk(id_trabajador, {
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const isSecurity = trabajador.CargoTrabajador?.nombre_cargo === 'Seguridad / Vigilante';
  const dateObj = new Date();
  const fecha = getVenezuelaDateString(dateObj);

  let asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  switch (tipoMovimiento) {
    case 'Entrada':
      if (asistencia && !asistencia.salida_manana) {
        if (asistencia.fecha === fecha || isSecurity) {
          throw new AppError('Ya tiene una entrada abierta. Debe registrar salida primero.', 400);
        }
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
      break;
    default:
      throw new AppError('Tipo de movimiento inválido', 400);
  }

  const horasManana = calcularHoras(asistencia.entrada_manana, asistencia.salida_manana);
  asistencia.horas_cumplidas_dia = horasManana && horasManana > 0 ? horasManana : null;
  await asistencia.save();

  const meta = {
    dispositivo: dispositivo || null,
    coordenadas: coordenadas ? JSON.stringify(coordenadas) : null,
    ip: req?.ip || req?.connection?.remoteAddress || null,
    user_agent: req?.headers?.['user-agent'] || null,
  };

  await registrarAuditoria({
    tipo: 'confirmacion_asistencia',
    detalle: `Asistencia ${tipoMovimiento} confirmada - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})${dispositivo ? ` - Dispositivo: ${dispositivo}` : ''}`,
    req,
  });

  return {
    message: `${tipoMovimiento} registrada para ${trabajador.nombres} ${trabajador.apellidos}`,
    tipoMovimiento,
    timestamp: dateObj.toISOString(),
    asistencia,
  };
};

exports.cambiarPin = async ({ qr_uuid, cedulaTrabajador, pin_actual, pin_nuevo }, req = null) => {
  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({ where: whereClause });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  if (!trabajador.pin_hash) {
    throw new AppError(
      'El trabajador no tiene un PIN configurado. Use la opción de restablecer PIN.',
      400
    );
  }

  const isMatch = await bcrypt.compare(pin_actual, trabajador.pin_hash);
  if (!isMatch) throw new AppError('El PIN actual es incorrecto.', 401);

  const salt = await bcrypt.genSalt(10);
  trabajador.pin_hash = await bcrypt.hash(pin_nuevo, salt);
  trabajador.pin_intentos_fallidos = 0;
  trabajador.pin_bloqueado_hasta = null;
  await trabajador.save();

  await registrarAuditoria({
    tipo: 'pin_cambio',
    detalle: `PIN cambiado - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})`,
    req,
  });

  return { message: 'PIN cambiado exitosamente.' };
};

exports.resetPinTrabajador = async (id_trabajador, req = null) => {
  const trabajador = await Trabajador.findByPk(id_trabajador);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const pinTemporal = String(Math.floor(1000 + Math.random() * 9000));
  const salt = await bcrypt.genSalt(10);
  trabajador.pin_hash = await bcrypt.hash(pinTemporal, salt);
  trabajador.pin_intentos_fallidos = 0;
  trabajador.pin_bloqueado_hasta = null;
  await trabajador.save();

  await registrarAuditoria({
    tipo: 'pin_reset',
    detalle: `PIN restablecido por administrador - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})`,
    req,
  });

  return { pinTemporal, message: 'PIN restablecido exitosamente.' };
};

async function registrarAuditoria({ tipo, detalle, req }) {
  try {
    await BitacoraAuditoria.create({
      tipo,
      detalle,
      ip: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[Auditoria PIN] Error al registrar:', err.message);
  }
}

exports.registrarFacialFallido = async ({ qr_uuid, cedulaTrabajador, motivo }, req = null) => {
  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({ where: whereClause });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  try {
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || '0.0.0.0';
    const userAgent = req?.headers?.['user-agent'] || 'desconocido';
    await BitacoraAuditoria.create({
      tipo: 'facial_fallido',
      detalle: `Verificación facial fallida - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula}) - Motivo: ${motivo || 'No coincide'}`,
      ip,
      user_agent: userAgent,
    });
  } catch (e) {
    // No bloquear si falla la auditoría
  }

  return { registrado: true };
};

const HORA_APERTURA = 8 * 60;
const HORA_CIERRE = 17 * 60;
const DESCANSO = 60;
const HORA_SALIDA_MINIMA = HORA_CIERRE - DESCANSO;

function minutosDesdeMediaNoche(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function esRetardo(entrada) {
  if (!entrada) return false;
  return minutosDesdeMediaNoche(entrada) > HORA_APERTURA + 5;
}

function esSalidaTemprano(salida) {
  if (!salida) return false;
  return minutosDesdeMediaNoche(salida) < HORA_SALIDA_MINIMA;
}

exports.updateObservaciones = async (id, observaciones, horas_justificadas, tipo_justificacion) => {
  const asistencia = await AsistenciaQR.findByPk(id);
  if (!asistencia) throw new AppError('Registro de asistencia no encontrado', 404);
  asistencia.observaciones = observaciones || null;
  if (horas_justificadas !== undefined) {
    asistencia.horas_justificadas = horas_justificadas || null;
  }
  if (tipo_justificacion !== undefined) {
    asistencia.tipo_justificacion = tipo_justificacion || null;
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
  const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(fechaActual);
  lunes.setDate(fechaActual.getDate() - diffLunes);
  const inicioStr = lunes.toISOString().split('T')[0];

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const finStr = domingo.toISOString().split('T')[0];

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
        tipo_justificacion: r.tipo_justificacion,
        retardo: esRetardo(r.entrada_manana),
        salida_temprano: esSalidaTemprano(r.salida_manana),
      })),
    };
  });

  return resumen;
};

exports.getAllAsistencias = async (page, limit, fecha) => {
  const query = {
    where: {},
    include: [
      {
        model: Trabajador,
        include: [{ model: CargoTrabajador }],
      },
    ],
    order: [['fecha', 'DESC']],
  };

  if (fecha) {
    query.where.fecha = fecha;
  }

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

exports.verificarFacial = async (
  { qr_uuid, cedulaTrabajador, descriptores_faciales, intento, total_intentos },
  req = null
) => {
  const whereClause = resolverWhereTrabajador(qr_uuid, cedulaTrabajador);
  if (!whereClause) throw new AppError('Debe proveer qr_uuid o cedulaTrabajador', 400);

  const trabajador = await Trabajador.findOne({
    where: whereClause,
    include: [{ model: CargoTrabajador }],
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);

  const tieneFacial =
    trabajador.usarFacial &&
    (!!trabajador.descriptor_facial || trabajador.descriptores_faciales?.length > 0);
  if (!tieneFacial) {
    throw new AppError('Verificación facial no habilitada para este trabajador.', 400);
  }

  // Si el frontend envía descriptores para enrolamiento, actualizar el array
  if (
    descriptores_faciales &&
    Array.isArray(descriptores_faciales) &&
    descriptores_faciales.length > 0
  ) {
    const arrayActual = trabajador.descriptores_faciales || [];
    if (trabajador.descriptor_facial && arrayActual.length === 0) {
      arrayActual.push(trabajador.descriptor_facial);
    }
    const combinados = [...arrayActual, ...descriptores_faciales];
    trabajador.descriptores_faciales = combinados;
    await trabajador.save();
  }

  const siguienteMovimiento = await exports.getSiguienteMovimiento(trabajador);
  const serverTime = new Date().toISOString();

  const payload = {
    id_trabajador: trabajador.id_trabajador,
    tipoMovimiento: siguienteMovimiento,
    origen: 'facial',
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: `${PIN_TOKEN_EXPIRACION_MIN}m`,
  });

  const numDescriptores =
    trabajador.descriptores_faciales?.length || (trabajador.descriptor_facial ? 1 : 0);

  // Auditoría detallada
  try {
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || '0.0.0.0';
    const userAgent = req?.headers?.['user-agent'] || 'desconocido';
    await BitacoraAuditoria.create({
      tipo: 'facial_exitoso',
      detalle: `Verificación facial exitosa - ${trabajador.nombres} ${trabajador.apellidos} (${trabajador.cedula})`,
      ip,
      user_agent: userAgent,
    });
  } catch (e) {
    // No bloquear si falla la auditoría
  }

  return {
    valido: true,
    token,
    trabajador: {
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      cedula: trabajador.cedula,
      id: trabajador.id_trabajador,
    },
    siguienteMovimiento,
    serverTime,
    descriptoresFaciales:
      trabajador.descriptores_faciales ||
      (trabajador.descriptor_facial ? [trabajador.descriptor_facial] : []),
    cantidadDescriptores: numDescriptores,
    intento: intento || 1,
    total_intentos: total_intentos || 1,
  };
};

exports.getSiguienteMovimiento = async (trabajador) => {
  const isSecurity = trabajador.CargoTrabajador?.nombre_cargo === 'Seguridad / Vigilante';
  const dateObj = new Date();
  const fecha = getVenezuelaDateString(dateObj);

  const asistencia = await AsistenciaQR.findOne({
    where: { id_trabajador: trabajador.id_trabajador },
    order: [['fecha', 'DESC']],
  });

  let siguienteMovimiento = 'Entrada';
  if (asistencia) {
    if (!asistencia.salida_manana) {
      if (asistencia.fecha === fecha || isSecurity) {
        siguienteMovimiento = 'Salida';
      }
    } else if (asistencia.fecha === fecha) {
      siguienteMovimiento = null;
    }
  }
  return siguienteMovimiento;
};
