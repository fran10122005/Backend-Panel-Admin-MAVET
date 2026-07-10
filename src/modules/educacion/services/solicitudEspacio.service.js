const { SolicitudEspacio, Persona, EspacioMuseo } = require('../../../models');
const AppError = require('../../../utils/AppError');

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

  return await SolicitudEspacio.create({
    id_espacio: solicitudData.id_espacio,
    id_persona: finalIdPersona,
    institucion: solicitudData.institucion,
    fecha_uso: solicitudData.fecha_uso || solicitudData.fecha_solicitada,
    hora_inicio: solicitudData.hora_inicio,
    hora_fin: solicitudData.hora_fin,
    motivo: solicitudData.motivo || solicitudData.motivo_uso,
    estado: solicitudData.estado || solicitudData.estado_solicitud || 'Pendiente',
  });
};

const getAllSolicitudes = async () => {
  return await SolicitudEspacio.findAll({
    include: [Persona, EspacioMuseo],
  });
};

const getSolicitudById = async (id) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }
  return solicitud;
};

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const updateSolicitud = async (id, solicitudData) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  if (fecha) {
    const parts = fecha.split('-');
    const parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
    if (parsedDate < getToday()) {
      throw new AppError('No se pueden editar solicitudes de eventos pasados', 400);
    }
  }

  return await solicitud.update(solicitudData);
};

const deleteSolicitud = async (id) => {
  const solicitud = await SolicitudEspacio.findByPk(id);
  if (!solicitud) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  // Validar si la solicitud ya pasó
  const fecha = solicitud.fecha_uso || solicitud.fecha_solicitada;
  if (fecha) {
    const parts = fecha.split('-');
    const parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
    if (parsedDate < getToday()) {
      throw new AppError('No se pueden eliminar solicitudes de eventos pasados', 400);
    }
  }

  return await solicitud.destroy();
};

module.exports = {
  createSolicitud,
  getAllSolicitudes,
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud,
};
