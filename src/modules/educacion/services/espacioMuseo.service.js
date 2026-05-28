const { EspacioMuseo } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createEspacio = async (data) => {
  return await EspacioMuseo.create(data);
};

exports.getAllEspacios = async () => {
  return await EspacioMuseo.findAll();
};

exports.getEspacioById = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return espacio;
};

exports.updateEspacio = async (id, data) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return await espacio.update(data);
};

exports.deleteEspacio = async (id) => {
  const espacio = await EspacioMuseo.findByPk(id);
  if (!espacio) throw new AppError('Espacio no encontrado', 404);
  return await espacio.destroy();
};
