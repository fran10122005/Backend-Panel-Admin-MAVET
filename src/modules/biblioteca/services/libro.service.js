const { Libro, CategoriaLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createLibro = async (data) => {
  return await Libro.create(data);
};

exports.getAllLibros = async () => {
  return await Libro.findAll({
    include: [CategoriaLibro]
  });
};

exports.getLibroById = async (id) => {
  const libro = await Libro.findByPk(id, {
    include: [CategoriaLibro]
  });
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return libro;
};

exports.updateLibro = async (id, data) => {
  const libro = await Libro.findByPk(id);
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return await libro.update(data);
};

exports.deleteLibro = async (id) => {
  const libro = await Libro.findByPk(id);
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return await libro.destroy();
};
