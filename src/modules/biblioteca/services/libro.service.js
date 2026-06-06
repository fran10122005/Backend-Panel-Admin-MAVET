const { Libro, CategoriaLibro, AutorLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

const processAutor = async (autorNombre, id_libro, t) => {
  if (!autorNombre) return;
  
  let autor = await AutorLibro.findOne({ where: { nombre: autorNombre }, transaction: t });
  if (!autor) {
    autor = await AutorLibro.create({ nombre: autorNombre }, { transaction: t });
  }

  // Verificar si ya existe la relación
  const relationExists = await sequelize.query(
    'SELECT 1 FROM libro_autores WHERE id_libro = ? AND id_autor = ?',
    { replacements: [id_libro, autor.id_autor], transaction: t, type: sequelize.QueryTypes.SELECT }
  );

  if (relationExists.length === 0) {
    await sequelize.query(
      'INSERT INTO libro_autores (id_libro, id_autor) VALUES (?, ?)',
      { replacements: [id_libro, autor.id_autor], transaction: t }
    );
  }
};

exports.createLibro = async (data) => {
  const t = await sequelize.transaction();
  try {
    const payload = {
      ...data,
      unidad: data.estante || data.unidad, // Mapeo de Frontend a Backend
      cantidad_total: data.cantidad || data.cantidad_total,
      cantidad_disponible: data.cuota !== undefined ? data.cuota : data.cantidad_disponible,
      estado: data.estado || 'Aprobado',
      fecha_ingreso: data.fecha_ingreso || new Date()
    };

    const newLibro = await Libro.create(payload, { transaction: t });

    if (data.autor) {
      await processAutor(data.autor, newLibro.id_libro, t);
    }

    await t.commit();
    return newLibro;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al crear el libro: ' + error.message, 500);
  }
};

exports.getAllLibros = async () => {
  return await Libro.findAll({
    include: [CategoriaLibro, AutorLibro]
  });
};

exports.getLibroById = async (id) => {
  const libro = await Libro.findByPk(id, {
    include: [CategoriaLibro, AutorLibro]
  });
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return libro;
};

exports.updateLibro = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const libro = await Libro.findByPk(id, { transaction: t });
    if (!libro) throw new AppError('Libro no encontrado', 404);

    const payload = {
      ...data,
      unidad: data.estante || data.unidad || libro.unidad,
      cantidad_total: data.cantidad !== undefined ? data.cantidad : libro.cantidad_total,
      cantidad_disponible: data.cuota !== undefined ? data.cuota : libro.cantidad_disponible,
      estado: data.estado || libro.estado
    };

    await libro.update(payload, { transaction: t });

    if (data.autor) {
      // Eliminar autores previos si es necesario actualizarlo (por simplicidad, borramos e insertamos)
      await sequelize.query('DELETE FROM libro_autores WHERE id_libro = ?', { replacements: [id], transaction: t });
      await processAutor(data.autor, id, t);
    }

    await t.commit();
    return libro;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al actualizar el libro: ' + error.message, 500);
  }
};

exports.deleteLibro = async (id) => {
  const libro = await Libro.findByPk(id);
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return await libro.destroy();
};
