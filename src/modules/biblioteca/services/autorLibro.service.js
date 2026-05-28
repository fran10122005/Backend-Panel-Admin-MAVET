const { AutorLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createAutor = async (data) => {
  return await AutorLibro.create(data);
};

exports.getAllAutores = async () => {
  return await AutorLibro.findAll();
};

exports.getAutorById = async (id) => {
  const autor = await AutorLibro.findByPk(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  return autor;
};

exports.updateAutor = async (id, data) => {
  const autor = await AutorLibro.findByPk(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  return await autor.update(data);
};

exports.deleteAutor = async (id) => {
  const autor = await AutorLibro.findByPk(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  return await autor.destroy();
};
