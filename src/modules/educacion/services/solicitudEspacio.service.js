const { SolicitudEspacio, Persona, EspacioMuseo, sequelize } = require('../../../models');
const AppError = require('../../../utils/AppError');
const validatorService = require('../../../services/validator.service');

const createSolicitud = async (solicitudData) => {
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

  return await SolicitudEspacio.create({
    codigo_reserva: solicitudData.codigo_reserva,
    id_espacio: solicitudData.id_espacio,
    id_persona: finalIdPersona,
    institucion: solicitudData.institucion,
    fecha_uso: fechaUsoFinal,
    hora_inicio: solicitudData.hora_inicio,
    hora_fin: solicitudData.hora_fin,
    motivo: solicitudData.motivo || solicitudData.motivo_uso,
    estado: solicitudData.estado || solicitudData.estado_solicitud || 'Pendiente',
  });
};

const mapEstadoDinamico = (solicitud) => {
  const data = solicitud.toJSON ? solicitud.toJSON() : solicitud;
  let fecha = data.fecha_uso || data.fecha_solicitada;

  // Format to YYYY-MM-DD if it's an ISO string or Date object
  if (fecha instanceof Date) {
    fecha = fecha.toISOString().split('T')[0];
  } else if (typeof fecha === 'string' && fecha.includes('T')) {
    fecha = fecha.split('T')[0];
  }

  if (data.fecha_uso) data.fecha_uso = fecha;
  if (data.fecha_solicitada) data.fecha_solicitada = fecha;

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

  return await solicitud.update(solicitudData);
};

const deleteSolicitud = async (id) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó (usamos su hora de inicio registrada)
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  await validatorService.validarFechaPasada(fecha, sequelize, 'eliminar', solicitud.hora_inicio);

  return await solicitud.destroy();
};

module.exports = {
  createSolicitud,
  getAllSolicitudes,
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud,
};
