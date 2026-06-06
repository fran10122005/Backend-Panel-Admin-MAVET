const SolicitudEspacio = require('../models/SolicitudEspacio.model');

const createSolicitud = async (solicitudData) => {
  try {
    return await SolicitudEspacio.create(solicitudData);
  } catch (error) {
    throw new Error('Error al crear la solicitud de espacio: ' + error.message);
  }
};

const getAllSolicitudes = async () => {
  try {
    return await SolicitudEspacio.findAll();
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
