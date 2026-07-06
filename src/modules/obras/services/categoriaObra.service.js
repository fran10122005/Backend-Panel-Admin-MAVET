const { CategoriaObra } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createCategoria = async (data) => {
  return await CategoriaObra.create(data);
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
  return await categoria.update(data);
};

exports.deleteCategoria = async (id) => {
  const categoria = await CategoriaObra.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return await categoria.destroy();
};
