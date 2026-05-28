const { Representante } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createRepresentante = async (data) => {
  return await Representante.create(data);
};

exports.getAllRepresentantes = async () => {
  return await Representante.findAll();
};

exports.getRepresentanteById = async (id) => {
  const representante = await Representante.findByPk(id);
  if (!representante) throw new AppError('Representante no encontrado', 404);
  return representante;
};

exports.updateRepresentante = async (id, data) => {
  const representante = await Representante.findByPk(id);
  if (!representante) throw new AppError('Representante no encontrado', 404);
  return await representante.update(data);
};

exports.deleteRepresentante = async (id) => {
  const representante = await Representante.findByPk(id);
  if (!representante) throw new AppError('Representante no encontrado', 404);
  return await representante.destroy();
};
