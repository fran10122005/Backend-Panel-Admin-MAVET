const { Entrega } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createEntrega = async (data) => {
  return await Entrega.create(data);
};

exports.getAllEntregas = async () => {
  return await Entrega.findAll();
};

exports.getEntregaById = async (id) => {
  const entrega = await Entrega.findByPk(id);
  if (!entrega) throw new AppError('Entrega no encontrada', 404);
  return entrega;
};

exports.updateEntrega = async (id, data) => {
  const entrega = await Entrega.findByPk(id);
  if (!entrega) throw new AppError('Entrega no encontrada', 404);
  return await entrega.update(data);
};

exports.deleteEntrega = async (id) => {
  const entrega = await Entrega.findByPk(id);
  if (!entrega) throw new AppError('Entrega no encontrada', 404);
  return await entrega.destroy();
};
