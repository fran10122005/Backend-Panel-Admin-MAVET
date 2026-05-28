const { EstadoObra } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createEstado = async (data) => {
  return await EstadoObra.create(data);
};

exports.getAllEstados = async () => {
  return await EstadoObra.findAll();
};

exports.getEstadoById = async (id) => {
  const estado = await EstadoObra.findByPk(id);
  if (!estado) throw new AppError('Estado no encontrado', 404);
  return estado;
};

exports.updateEstado = async (id, data) => {
  const estado = await EstadoObra.findByPk(id);
  if (!estado) throw new AppError('Estado no encontrado', 404);
  return await estado.update(data);
};

exports.deleteEstado = async (id) => {
  const estado = await EstadoObra.findByPk(id);
  if (!estado) throw new AppError('Estado no encontrado', 404);
  return await estado.destroy();
};
