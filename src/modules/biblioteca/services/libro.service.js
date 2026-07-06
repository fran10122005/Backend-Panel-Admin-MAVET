const { Libro, CategoriaLibro, AutorLibro } = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

exports.createLibro = async (data) => {
  const t = await sequelize.transaction();
  try {
    const payload = {
      titulo: data.titulo,
      unidad: data.unidad || null,
      cuota: data.cuota || null,
      estante: data.estante || null,
      ano_libro: data.ano_libro || null,
      id_categoria: data.id_categoria || null,
      cantidad_total: data.cantidad_total || 1,
      cantidad_disponible: data.cantidad_total || 1,
      estado: data.estado || 'Aprobado',
      fecha_ingreso: data.fecha_ingreso || new Date(),
    };

    const newLibro = await Libro.create(payload, { transaction: t });
    const libroId = newLibro.id_libro || newLibro.id;

    if (data.autor && !data.id_autor) {
      const nombreCompleto = data.autor.trim();
      const partes = nombreCompleto.split(/\s+/);
      const nombre = partes[0];
      const apellido = partes.slice(1).join(' ') || '';

      const [autor] = await AutorLibro.findOrCreate({
        where: { nombre, apellido },
        defaults: { nombre, apellido },
        transaction: t,
      });

      await sequelize.query(
        'INSERT INTO libro_autores (id_libro, id_autor) VALUES (:id_libro, :id_autor)',
        {
          replacements: { id_libro: libroId, id_autor: autor.id_autor },
          transaction: t,
        }
      );
    } else if (data.id_autor) {
      await sequelize.query(
        'INSERT INTO libro_autores (id_libro, id_autor) VALUES (:id_libro, :id_autor)',
        {
          replacements: { id_libro: libroId, id_autor: data.id_autor },
          transaction: t,
        }
      );
    }

    await t.commit();
    return newLibro;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al crear el libro: ' + error.message, 500);
  }
};

function serializarLibro(libro) {
  const json = libro.toJSON?.() || libro;
  const primerAutor = json.AutorLibros?.[0] || json.AutorLibro?.[0] || json.autores_libros?.[0];
  json.autor = primerAutor
    ? `${primerAutor.nombre || ''} ${primerAutor.apellido || ''}`.trim()
    : json.autor || 'Desconocido';
  json.id_autor = primerAutor?.id_autor || json.id_autor;
  return json;
}

exports.getAllLibros = async (page, limit) => {
  const query = {
    include: [{ model: CategoriaLibro }, { model: AutorLibro }],
    order: [['created_at', 'DESC']],
  };

  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Libro.findAndCountAll(query);
    return {
      data: rows.map(serializarLibro),
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }

  const rows = await Libro.findAll(query);
  return rows.map(serializarLibro);
};

exports.getLibroById = async (id) => {
  const libro = await Libro.findByPk(id, {
    include: [{ model: CategoriaLibro }, { model: AutorLibro }],
  });
  if (!libro) throw new AppError('Libro no encontrado', 404);
  return serializarLibro(libro);
};

exports.getLibrosPublicos = async (page, limit) => {
  const query = {
    attributes: ['id_libro', 'titulo', 'ano_libro', 'estado'],
    include: [
      { model: CategoriaLibro, attributes: ['nombre_categoria'] },
      { model: AutorLibro, attributes: ['nombre', 'apellido'] },
    ],
    where: { estado: 'Aprobado' },
    order: [['created_at', 'DESC']],
  };

  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Libro.findAndCountAll(query);
    return {
      data: rows.map(serializarLibro),
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }

  const rows = await Libro.findAll(query);
  return rows.map(serializarLibro);
};

exports.updateLibro = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const libro = await Libro.findByPk(id, { transaction: t });
    if (!libro) throw new AppError('Libro no encontrado', 404);

    const payload = {
      titulo: data.titulo !== undefined ? data.titulo : libro.titulo,
      unidad: data.unidad !== undefined ? data.unidad : libro.unidad,
      cuota: data.cuota !== undefined ? data.cuota : libro.cuota,
      estante: data.estante !== undefined ? data.estante : libro.estante,
      ano_libro: data.ano_libro !== undefined ? data.ano_libro : libro.ano_libro,
      id_categoria:
        data.id_categoria !== undefined ? data.id_categoria || null : libro.id_categoria,
      cantidad_total:
        data.cantidad_total !== undefined ? data.cantidad_total : libro.cantidad_total,
      cantidad_disponible:
        data.cantidad_disponible !== undefined
          ? data.cantidad_disponible
          : libro.cantidad_disponible,
      estado: data.estado !== undefined ? data.estado : libro.estado,
      fecha_ingreso: data.fecha_ingreso !== undefined ? data.fecha_ingreso : libro.fecha_ingreso,
    };

    await libro.update(payload, { transaction: t });
    const libroId = libro.id_libro || libro.id;

    // Limpiar autores anteriores y vincular el nuevo
    await sequelize.query('DELETE FROM libro_autores WHERE id_libro = :id_libro', {
      replacements: { id_libro: libroId },
      transaction: t,
    });

    if (data.autor && !data.id_autor) {
      const nombreCompleto = data.autor.trim();
      const partes = nombreCompleto.split(/\s+/);
      const nombre = partes[0];
      const apellido = partes.slice(1).join(' ') || '';

      const [autor] = await AutorLibro.findOrCreate({
        where: { nombre, apellido },
        defaults: { nombre, apellido },
        transaction: t,
      });

      await sequelize.query(
        'INSERT INTO libro_autores (id_libro, id_autor) VALUES (:id_libro, :id_autor)',
        {
          replacements: { id_libro: libroId, id_autor: autor.id_autor },
          transaction: t,
        }
      );
    } else if (data.id_autor) {
      await sequelize.query(
        'INSERT INTO libro_autores (id_libro, id_autor) VALUES (:id_libro, :id_autor)',
        {
          replacements: { id_libro: libroId, id_autor: data.id_autor },
          transaction: t,
        }
      );
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
  await sequelize.query('DELETE FROM libro_autores WHERE id_libro = :id_libro', {
    replacements: { id_libro: id },
  });
  return await libro.destroy();
};

exports.devolverLibro = async (id_libro) => {
  const { ConsultaSala, Libro } = require('../../../models');

  const consulta = await ConsultaSala.findOne({
    where: { id_libro, estado: 'ACTIVO' },
    order: [['id_consulta', 'DESC']],
  });

  if (!consulta) {
    const consultaAlternativa = await ConsultaSala.findOne({
      where: { id_libro, estado: 'Pendiente' },
      order: [['id_consulta', 'DESC']],
    });

    if (!consultaAlternativa) {
      const libro = await Libro.findByPk(id_libro);
      if (libro && parseInt(libro.cantidad_disponible, 10) < parseInt(libro.cantidad_total, 10)) {
        const nueva = String(parseInt(libro.cantidad_disponible, 10) + 1);
        await Libro.update({ cantidad_disponible: nueva }, { where: { id_libro } });
        return true;
      }
      throw new AppError('No se encontró un préstamo activo para este libro', 404);
    }

    await consultaAlternativa.update({ estado: 'Devuelto' });
    const libroAlt = await Libro.findByPk(id_libro);
    if (
      libroAlt &&
      parseInt(libroAlt.cantidad_disponible, 10) < parseInt(libroAlt.cantidad_total, 10)
    ) {
      const nueva = String(parseInt(libroAlt.cantidad_disponible, 10) + 1);
      await Libro.update({ cantidad_disponible: nueva }, { where: { id_libro } });
    }
    return true;
  }

  await consulta.update({ estado: 'Devuelto', hora_devolucion: new Date() });
  const libro = await Libro.findByPk(id_libro);
  if (libro && parseInt(libro.cantidad_disponible, 10) < parseInt(libro.cantidad_total, 10)) {
    const nueva = String(parseInt(libro.cantidad_disponible, 10) + 1);
    await Libro.update({ cantidad_disponible: nueva }, { where: { id_libro } });
  }
  return true;
};
