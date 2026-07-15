const { SolicitudEspacio, Persona, EspacioMuseo, sequelize } = require('../../../models');
const AppError = require('../../../utils/AppError');
const validatorService = require('../../../services/validator.service');
const cacheService = require('../../../services/cache.service');

const aprobarSolicitud = async (id, usuarioId) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
  if (solicitud.estatus_aprobacion !== 'pendiente') {
    throw new AppError(`La solicitud ya ha sido ${solicitud.estatus_aprobacion}`, 400);
  }
  solicitud.estatus_aprobacion = 'aprobado';
  solicitud.id_usuario_aprobador = usuarioId;
  solicitud.fecha_aprobacion = new Date();
  await solicitud.save();
  return solicitud;
};

const rechazarSolicitud = async (id, usuarioId, motivo) => {
  if (!motivo || !motivo.trim()) {
    throw new AppError('Debe proporcionar un motivo de rechazo', 400);
  }
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404);
  if (solicitud.estatus_aprobacion !== 'pendiente') {
    throw new AppError(`La solicitud ya ha sido ${solicitud.estatus_aprobacion}`, 400);
  }
  solicitud.estatus_aprobacion = 'rechazado';
  solicitud.id_usuario_aprobador = usuarioId;
  solicitud.fecha_aprobacion = new Date();
  solicitud.motivo_rechazo = motivo.trim();
  await solicitud.save();
  return solicitud;
};

const createSolicitud = async (solicitudData, usuario = null) => {
  let finalIdPersona = solicitudData.id_persona;

  if (!finalIdPersona && solicitudData.cedula) {
    const persona = await Persona.findOne({ where: { cedula: solicitudData.cedula } });
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

  const estatusFinal = ['aprobado', 'confirmado'].includes(solicitudData.estatus_aprobacion)
    ? 'aprobado'
    : 'pendiente';

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
    estatus_aprobacion: estatusFinal,
  };

  if (estatusFinal === 'aprobado' && usuario && usuario.id_usuario) {
    createPayload.id_usuario_aprobador = usuario.id_usuario;
    createPayload.fecha_aprobacion = new Date();
  }

  const result = await SolicitudEspacio.create(createPayload);
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
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

  // Solo marcar como Realizada si la solicitud fue aprobada y la hora ya pasó
  if (data.estatus_aprobacion === 'aprobado') {
    const horaFin = data.hora_fin;
    if (fecha && horaFin) {
      const eventEnd = new Date(`${fecha}T${horaFin}`);
      const now = new Date();
      data.estado = eventEnd < now ? 'Realizada' : 'Pendiente';
    } else {
      data.estado = 'Pendiente';
    }
  } else {
    data.estado = 'Pendiente';
  }
  return data;
};

const getAllSolicitudes = async () => {
  const { Usuario } = require('../../../models');
  const solicitudes = await SolicitudEspacio.findAll({
    include: [Persona, EspacioMuseo, Usuario],
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

const updateSolicitud = async (id, solicitudData) => {
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

  const result = await solicitud.update(solicitudData);
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
  return result;
};

const deleteSolicitud = async (id) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó (usamos su hora de inicio registrada)
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  await validatorService.validarFechaPasada(fecha, sequelize, 'eliminar', solicitud.hora_inicio);

  await solicitud.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/public/agenda*');
};

module.exports = {
  createSolicitud,
  getAllSolicitudes,
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
};
