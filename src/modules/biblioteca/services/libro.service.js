const { Libro, CategoriaLibro, AutorLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

exports.createLibro = async (data) => {
  const t = await sequelize.transaction();
  try {
    const payload = {
      titulo:              data.titulo,
      unidad:              data.unidad              || null,
      cuota:               data.cuota               || null,
      estante:             data.estante             || null,
      ano_libro:           data.ano_libro           || null,
      id_categoria:        data.id_categoria        || null,
      cantidad_total:      data.cantidad_total      || 1,
      cantidad_disponible: data.cantidad_total      || 1, // al crear, disponible = total
      estado:              data.estado              || 'Aprobado',
      fecha_ingreso:       data.fecha_ingreso       || new Date()
    };

    const newLibro = await Libro.create(payload, { transaction: t });

    // Vincular autor via relación Many-to-Many (inserta en libro_autores automáticamente)
    if (data.id_autor) {
      await newLibro.setAutorLibros([data.id_autor], { transaction: t });
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
    include: [
      { model: CategoriaLibro },
      { model: AutorLibro }
    ],
    order: [['created_at', 'DESC']]
  });
};

exports.getLibroById = async (id) => {
  const libro = await Libro.findByPk(id, {
    include: [
      { model: CategoriaLibro },
      { model: AutorLibro }
    ]
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
      titulo:              data.titulo              !== undefined ? data.titulo              : libro.titulo,
      unidad:              data.unidad              !== undefined ? data.unidad              : libro.unidad,
      cuota:               data.cuota               !== undefined ? data.cuota               : libro.cuota,
      estante:             data.estante             !== undefined ? data.estante             : libro.estante,
      ano_libro:           data.ano_libro           !== undefined ? data.ano_libro           : libro.ano_libro,
      id_categoria:        data.id_categoria        !== undefined ? data.id_categoria        : libro.id_categoria,
      cantidad_total:      data.cantidad_total      !== undefined ? data.cantidad_total      : libro.cantidad_total,
      cantidad_disponible: data.cantidad_disponible !== undefined ? data.cantidad_disponible : libro.cantidad_disponible,
      estado:              data.estado              !== undefined ? data.estado              : libro.estado,
      fecha_ingreso:       data.fecha_ingreso       !== undefined ? data.fecha_ingreso       : libro.fecha_ingreso
    };

    await libro.update(payload, { transaction: t });

    // Actualizar relación con autor (setAutorLibros reemplaza los anteriores)
    if (data.id_autor) {
      await libro.setAutorLibros([data.id_autor], { transaction: t });
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
  // Las filas de libro_autores se eliminan automáticamente (ON DELETE CASCADE o setAutorLibros([]))
  await libro.setAutorLibros([]);
  return await libro.destroy();
};

exports.devolverLibro = async (id_libro) => {
  const { ConsultaSala } = require('../../../models');

  // Buscar el préstamo activo de este libro
  const consulta = await ConsultaSala.findOne({
    where: { id_libro, estado: 'ACTIVO' },
    order: [['createdAt', 'DESC']]
  });

  if (!consulta) {
    // Intentar con estado alternativo 'Pendiente'
    const consultaAlternativa = await ConsultaSala.findOne({
      where: { id_libro, estado: 'Pendiente' },
      order: [['createdAt', 'DESC']]
    });

    if (!consultaAlternativa) {
      throw new AppError('No se encontró un préstamo activo para este libro', 404);
    }

    await consultaAlternativa.update({ estado: 'Devuelto' });
    return true;
  }

  await consulta.update({ estado: 'Devuelto' });
  return true;
};
