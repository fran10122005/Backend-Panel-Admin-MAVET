const { SolicitudEspacio, Persona, EspacioMuseo } = require('../../../models');

const createSolicitud = async (solicitudData) => {
  try {
    let finalIdPersona = solicitudData.id_persona;
    
    if (!finalIdPersona && solicitudData.cedula) {
      const persona = await Persona.findOne({ where: { cedula: solicitudData.cedula } });
      if (!persona) {
        throw new Error('La persona con cédula ' + solicitudData.cedula + ' no está registrada en el sistema. Debe registrar su ingreso como visitante primero.');
      }
      finalIdPersona = persona.id_persona;
    }

    if (!finalIdPersona) {
      throw new Error('Se requiere id_persona o cédula para registrar la solicitud');
    }

    return await SolicitudEspacio.create({
      id_espacio: solicitudData.id_espacio,
      id_persona: finalIdPersona,
      institucion: solicitudData.institucion,
      fecha_uso: solicitudData.fecha_uso || solicitudData.fecha_solicitada,
      hora_inicio: solicitudData.hora_inicio,
      hora_fin: solicitudData.hora_fin,
      motivo: solicitudData.motivo || solicitudData.motivo_uso,
      estado: solicitudData.estado || solicitudData.estado_solicitud || 'Pendiente'
    });
  } catch (error) {
    throw new Error('Error al crear la solicitud de espacio: ' + error.message);
  }
};

const getAllSolicitudes = async () => {
  try {
    return await SolicitudEspacio.findAll({
      include: [Persona, EspacioMuseo]
    });
  } catch (error) {
    throw new Error('Error al obtener las solicitudes de espacio: ' + error.message);
  }
};

const getSolicitudById = async (id) => {
  try {
    return await SolicitudEspacio.findByPk(id);
  } catch (error) {
    throw new Error('Error al obtener la solicitud de espacio: ' + error.message);
  }
};

const updateSolicitud = async (id, solicitudData) => {
  try {
    const solicitud = await SolicitudEspacio.findByPk(id);
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }
    return await solicitud.update(solicitudData);
  } catch (error) {
    throw new Error('Error al actualizar la solicitud de espacio: ' + error.message);
  }
};

const deleteSolicitud = async (id) => {
  try {
    const solicitud = await SolicitudEspacio.findByPk(id);
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }
    return await solicitud.destroy();
  } catch (error) {
    throw new Error('Error al eliminar la solicitud de espacio: ' + error.message);
  }
};

module.exports = {
  createSolicitud,
  getAllSolicitudes,
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud
};
