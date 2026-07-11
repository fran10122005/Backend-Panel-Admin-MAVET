const { EstadoObra } = require('../../../models');
const AppError = require('../../../utils/AppError');
const cacheService = require('../../../services/cache.service');

exports.createEstado = async (data) => {
  const result = await EstadoObra.create(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/estados*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
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
  const result = await estado.update(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/estados*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.deleteEstado = async (id) => {
  const estado = await EstadoObra.findByPk(id);
  if (!estado) throw new AppError('Estado no encontrado', 404);
  const result = await estado.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/obras/estados*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};
