const { CategoriaObra } = require('../../../models');
const AppError = require('../../../utils/AppError');
const cacheService = require('../../../services/cache.service');

exports.createCategoria = async (data) => {
  const result = await CategoriaObra.create(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/categorias*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.getAllCategorias = async () => {
  return await CategoriaObra.findAll();
};

exports.getCategoriaById = async (id) => {
  const categoria = await CategoriaObra.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return categoria;
};

exports.updateCategoria = async (id, data) => {
  const categoria = await CategoriaObra.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  const result = await categoria.update(data);
  await cacheService.eliminarPatron('mavet:resp:/api/obras/categorias*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};

exports.deleteCategoria = async (id) => {
  const categoria = await CategoriaObra.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  const result = await categoria.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/obras/categorias*');
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};
