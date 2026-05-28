const { CategoriaLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createCategoria = async (data) => {
  return await CategoriaLibro.create(data);
};

exports.getAllCategorias = async () => {
  return await CategoriaLibro.findAll();
};

exports.getCategoriaById = async (id) => {
  const categoria = await CategoriaLibro.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return categoria;
};

exports.updateCategoria = async (id, data) => {
  const categoria = await CategoriaLibro.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return await categoria.update(data);
};

exports.deleteCategoria = async (id) => {
  const categoria = await CategoriaLibro.findByPk(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return await categoria.destroy();
};
