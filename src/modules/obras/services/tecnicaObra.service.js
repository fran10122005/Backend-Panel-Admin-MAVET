const { TecnicaObra } = require('../../../models');
const AppError = require('../../../utils/AppError');
const cacheService = require('../../../services/cache.service');

exports.createTecnica = async (data) => {
  const result = await TecnicaObra.create(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/tecnicas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.getAllTecnicas = async () => {
  return await TecnicaObra.findAll();
};

exports.getTecnicaById = async (id) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  return tecnica;
};

exports.updateTecnica = async (id, data) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  const result = await tecnica.update(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/tecnicas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.deleteTecnica = async (id) => {
  const tecnica = await TecnicaObra.findByPk(id);
  if (!tecnica) throw new AppError('Tecnica no encontrada', 404);
  const result = await tecnica.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/obras/tecnicas*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};
