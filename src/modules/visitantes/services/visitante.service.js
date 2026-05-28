const { Visitante } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createVisitante = async (data) => {
  return await Visitante.create(data);
};

exports.getAllVisitantes = async () => {
  return await Visitante.findAll();
};

exports.getVisitanteById = async (id) => {
  const visitante = await Visitante.findByPk(id);
  if (!visitante) throw new AppError('Visitante no encontrado', 404);
  return visitante;
};

exports.updateVisitante = async (id, data) => {
  const visitante = await Visitante.findByPk(id);
  if (!visitante) throw new AppError('Visitante no encontrado', 404);
  return await visitante.update(data);
};

exports.deleteVisitante = async (id) => {
  const visitante = await Visitante.findByPk(id);
  if (!visitante) throw new AppError('Visitante no encontrado', 404);
  return await visitante.destroy();
};
