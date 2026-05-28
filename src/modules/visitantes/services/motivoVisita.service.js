const { MotivoVisita } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createMotivo = async (data) => {
  return await MotivoVisita.create(data);
};

exports.getAllMotivos = async () => {
  return await MotivoVisita.findAll();
};

exports.getMotivoById = async (id) => {
  const motivo = await MotivoVisita.findByPk(id);
  if (!motivo) throw new AppError('Motivo no encontrado', 404);
  return motivo;
};

exports.updateMotivo = async (id, data) => {
  const motivo = await MotivoVisita.findByPk(id);
  if (!motivo) throw new AppError('Motivo no encontrado', 404);
  return await motivo.update(data);
};

exports.deleteMotivo = async (id) => {
  const motivo = await MotivoVisita.findByPk(id);
  if (!motivo) throw new AppError('Motivo no encontrado', 404);
  return await motivo.destroy();
};
