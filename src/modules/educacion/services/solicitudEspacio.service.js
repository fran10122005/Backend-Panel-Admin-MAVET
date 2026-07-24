const {
  SolicitudEspacio,
  Persona,
  EspacioMuseo,
  BitacoraAuditoria,
  sequelize,
} = require('../../../models');
const AppError = require('../../../utils/AppError');
const validatorService = require('../../../services/validator.service');
const cacheService = require('../../../services/cache.service');
const emailjsService = require('../../../services/emailjs.service');

const formatDateForEmail = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeForEmail = (timeStr) => {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
};

const formatDateRegistration = (date) => {
  const now = date ? new Date(date) : new Date();
  if (isNaN(now.getTime())) return '—';
  return now.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatResources = (resources) => {
  if (!resources || !Array.isArray(resources) || resources.length === 0) return '';
  return resources.join(', ');
};

// Funciones aprobar/rechazar removidas.

const createSolicitud = async (solicitudData, usuario = null) => {
  let finalIdPersona = solicitudData.id_persona;

  if (!finalIdPersona && solicitudData.cedula) {
    const cedulaLimpia = solicitudData.cedula.replace(/\D/g, '');
    let persona = await Persona.findOne({ where: { cedula: solicitudData.cedula } });
    if (!persona && cedulaLimpia) {
      persona = await Persona.findOne({
        where: sequelize.where(
          sequelize.fn('REGEXP_REPLACE', sequelize.col('cedula'), '[^0-9]', '', 'g'),
          cedulaLimpia
        ),
      });
    }
    if (!persona) {
      throw new AppError(
        'La persona con cédula ' +
          solicitudData.cedula +
          ' no está registrada en el sistema. Debe registrar su ingreso como visitante primero.',
        400
      );
    }
    finalIdPersona = persona.id_persona;
  }

  if (!finalIdPersona) {
    throw new AppError('Se requiere id_persona o cédula para registrar la solicitud', 400);
  }

  const fechaUsoFinal = solicitudData.fecha_uso || solicitudData.fecha_solicitada;

  // Validar que la fecha (y hora si es hoy) no haya pasado
  await validatorService.validarFechaPasada(
    fechaUsoFinal,
    sequelize,
    'crear',
    solicitudData.hora_inicio
  );

  // Validar que sea del mes presente
  await validatorService.validarMesPresente(fechaUsoFinal, sequelize);

  // Validar solapamiento de horario
  await validatorService.validarSolapamientoHorario(
    SolicitudEspacio,
    solicitudData.id_espacio,
    fechaUsoFinal,
    solicitudData.hora_inicio,
    solicitudData.hora_fin
  );

  const createPayload = {
    codigo_reserva: solicitudData.codigo_reserva,
    id_espacio: solicitudData.id_espacio,
    id_persona: finalIdPersona,
    institucion: solicitudData.institucion,
    fecha_uso: fechaUsoFinal,
    hora_inicio: solicitudData.hora_inicio,
    hora_fin: solicitudData.hora_fin,
    motivo: solicitudData.motivo || solicitudData.motivo_uso,
    estado: solicitudData.estado || solicitudData.estado_solicitud || 'Pendiente',
    correo_electronico: solicitudData.correo_electronico,
    recursos_solicitados: solicitudData.recursos_solicitados || [],
    nombre_responsable: solicitudData.nombre_responsable || solicitudData.organizador,
  };

  const result = await SolicitudEspacio.create(createPayload);

  if (usuario) {
    await BitacoraAuditoria.create({
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      tipo: 'create',
      detalle: `Se registró una nueva reserva de espacio [${result.id_solicitud}] para: ${solicitudData.institucion || 'Persona Natural'}`,
    });
  }

  await Promise.all([
    cacheService.eliminarPatron('mavet:resp:/api/educacion*'),
    cacheService.eliminarPatron('mavet:resp:/api/public/agenda*'),
  ]);

  // Enviar correo de confirmación al organizador
  if (result.correo_electronico) {
    try {
      const espacio = await EspacioMuseo.findByPk(result.id_espacio);
      const nombreEspacio = espacio?.nombre_espacio || 'Auditorio MAVET';

      await emailjsService.sendAuditReservationConfirmation({
        to: result.correo_electronico,
        nombreResponsable: result.nombre_responsable || 'Organizador',
        codigoReserva: result.codigo_reserva,
        numeroExpediente: result.numero_expediente,
        institucion: result.institucion,
        motivo: result.motivo,
        fechaUso: result.fecha_uso,
        horaInicio: result.hora_inicio,
        horaFin: result.hora_fin,
        fechaRegistro: formatDateRegistration(),
        fechaFormateada: formatDateForEmail(result.fecha_uso),
        horaInicioFormateada: formatTimeForEmail(result.hora_inicio),
        horaFinFormateada: formatTimeForEmail(result.hora_fin),
        recursosSolicitados: formatResources(result.recursos_solicitados),
        espacio: nombreEspacio,
      });
      console.log('✅ Correo de confirmación enviado a:', result.correo_electronico);
    } catch (emailError) {
      console.error('❌ Error enviando correo de confirmación:', emailError.message);
      // No lanzamos error para no fallar la reserva si el correo falla
    }
  }

  return result;
};

const mapEstadoDinamico = (solicitud) => {
  const data = solicitud.toJSON ? solicitud.toJSON() : solicitud;
  let fecha = data.fecha_uso || data.fecha_solicitada;

  if (fecha instanceof Date) {
    fecha = fecha.toISOString().split('T')[0];
  } else if (typeof fecha === 'string' && fecha.includes('T')) {
    fecha = fecha.split('T')[0];
  }

  if (data.fecha_uso) data.fecha_uso = fecha;
  if (data.fecha_solicitada) data.fecha_solicitada = fecha;

  // Solo marcar como Realizada si la hora ya pasó
  const horaFin = data.hora_fin;
  if (fecha && horaFin) {
    const eventEnd = new Date(`${fecha}T${horaFin}`);
    const now = new Date();
    data.estado = eventEnd < now ? 'Realizada' : 'Pendiente';
  } else {
    data.estado = 'Pendiente';
  }
  return data;
};

const getAllSolicitudes = async () => {
  const solicitudes = await SolicitudEspacio.findAll({
    include: [Persona, EspacioMuseo],
  });
  return solicitudes.map(mapEstadoDinamico);
};

const getSolicitudById = async (id) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }
  return mapEstadoDinamico(solicitud);
};

const updateSolicitud = async (id, solicitudData, user) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó (Source of Truth)
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  const hora = solicitudData.hora_inicio || solicitud.hora_inicio;
  await validatorService.validarFechaPasada(fecha, sequelize, 'editar', hora);

  const nuevaFecha = solicitudData.fecha_uso || solicitudData.fecha_solicitada || fecha;
  // Validar mes presente
  await validatorService.validarMesPresente(nuevaFecha, sequelize);
  const nuevaHoraInicio = solicitudData.hora_inicio || solicitud.hora_inicio;
  const nuevaHoraFin = solicitudData.hora_fin || solicitud.hora_fin;
  const nuevoEspacio = solicitudData.id_espacio || solicitud.id_espacio;

  await validatorService.validarSolapamientoHorario(
    SolicitudEspacio,
    nuevoEspacio,
    nuevaFecha,
    nuevaHoraInicio,
    nuevaHoraFin,
    id // idExcluido para que no marque conflicto consigo mismo
  );

  const updatePayload = {};
  if (solicitudData.id_espacio !== undefined) updatePayload.id_espacio = solicitudData.id_espacio;
  if (solicitudData.institucion !== undefined)
    updatePayload.institucion = solicitudData.institucion;
  if (solicitudData.fecha_uso !== undefined) updatePayload.fecha_uso = solicitudData.fecha_uso;
  if (solicitudData.fecha_solicitada !== undefined && solicitudData.fecha_uso === undefined)
    updatePayload.fecha_uso = solicitudData.fecha_solicitada;
  if (solicitudData.hora_inicio !== undefined)
    updatePayload.hora_inicio = solicitudData.hora_inicio;
  if (solicitudData.hora_fin !== undefined) updatePayload.hora_fin = solicitudData.hora_fin;
  if (solicitudData.motivo !== undefined) updatePayload.motivo = solicitudData.motivo;
  if (solicitudData.motivo_uso !== undefined && solicitudData.motivo === undefined)
    updatePayload.motivo = solicitudData.motivo_uso;
  if (solicitudData.estado !== undefined) updatePayload.estado = solicitudData.estado;
  if (solicitudData.estado_solicitud !== undefined && solicitudData.estado === undefined)
    updatePayload.estado = solicitudData.estado_solicitud;
  if (solicitudData.correo_electronico !== undefined)
    updatePayload.correo_electronico = solicitudData.correo_electronico;
  if (solicitudData.recursos_solicitados !== undefined)
    updatePayload.recursos_solicitados = solicitudData.recursos_solicitados;

  const result = await solicitud.update(updatePayload);

  if (arguments[2]) {
    const user = arguments[2];
    await BitacoraAuditoria.create({
      id_usuario: user.id_usuario,
      correo: user.correo,
      tipo: 'update',
      detalle: `Se actualizó la reserva de espacio [${solicitud.id_solicitud}]`,
    });
  }

  await Promise.all([
    cacheService.eliminarPatron('mavet:resp:/api/educacion*'),
    cacheService.eliminarPatron('mavet:resp:/api/public/agenda*'),
  ]);
  return result;
};

const deleteSolicitud = async (id, user) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó (usamos su hora de inicio registrada)
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  await validatorService.validarFechaPasada(fecha, sequelize, 'eliminar', solicitud.hora_inicio);

  await solicitud.destroy();

  if (user) {
    await BitacoraAuditoria.create({
      id_usuario: user.id_usuario,
      correo: user.correo,
      tipo: 'delete',
      detalle: `Se canceló / eliminó la reserva de espacio [${solicitud.id_solicitud}]`,
    });
  }

  await Promise.all([
    cacheService.eliminarPatron('mavet:resp:/api/educacion*'),
    cacheService.eliminarPatron('mavet:resp:/api/public/agenda*'),
  ]);
};

module.exports = {
  createSolicitud,
  getAllSolicitudes,
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud,
};
