const {
  Obra,
  Artista,
  TecnicaObra,
  EstadoObra,
  CategoriaObra,
  Entrega,
  ImagenWeb,
} = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');
const cacheService = require('../../../services/cache.service');

const subirImagenObra = async (filePath) => {
  const cloudinary = require('../../../config/cloudinary');
  const fs = require('fs');
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'mavet_uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    });
    return result.secure_url;
  } catch (err) {
    console.error('Error uploading image to Cloudinary', err);
    throw new AppError('Error al procesar la imagen.', 500);
  } finally {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {
      /* ignore */
    }
  }
};

exports.subirImagen = subirImagenObra;

const allowedFields = [
  'codigo_inventario',
  'titulo',
  'id_artista',
  'id_tecnica',
  'id_estado_actual',
  'id_categoria_obra',
  'anio',
  'tipo_ingreso',
  'piezas',
  'peso',
  'descripcion',
  'ubicacion_actual',
  'medidas',
  'clasificacion_patrimonial',
  'id_entrega',
  'modalidad',
  'imagen_url',
];

const processForeignKeys = async (data, transaction) => {
  let id_artista = data.id_artista;
  let id_tecnica = data.id_tecnica;
  let id_estado_actual = data.id_estado_actual;

  if (!id_artista && data.autor) {
    let nombres = data.autor;
    let apellidos = '';
    const parts = data.autor.split(' ');
    if (parts.length > 1) {
      nombres = parts[0];
      apellidos = parts.slice(1).join(' ');
    }

    let artista = await Artista.findOne({ where: { nombres, apellidos }, transaction });
    if (!artista) {
      artista = await Artista.create({ nombres, apellidos }, { transaction });
    }
    id_artista = artista.id_artista;
  }

  if (!id_tecnica && data.tecnica) {
    let tecnica = await TecnicaObra.findOne({
      where: { nombre_tecnica: data.tecnica },
      transaction,
    });
    if (!tecnica) {
      tecnica = await TecnicaObra.create({ nombre_tecnica: data.tecnica }, { transaction });
    }
    id_tecnica = tecnica.id_tecnica;
  }

  if (!id_estado_actual && data.estado) {
    let estado = await EstadoObra.findOne({ where: { nombre_estado: data.estado }, transaction });
    if (!estado) {
      estado = await EstadoObra.create({ nombre_estado: data.estado }, { transaction });
    }
    id_estado_actual = estado.id_estado;
  }

  return { id_artista, id_tecnica, id_estado_actual };
};

exports.createObra = async (data) => {
  const t = await sequelize.transaction();
  try {
    const { id_artista, id_tecnica, id_estado_actual } = await processForeignKeys(data, t);

    let codigo_inventario = data.codigo_inventario || `SIN-CODIGO-${Date.now()}`;

    // Construir objeto solo con campos permitidos para evitar Validation error de Sequelize
    const obraData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) obraData[field] = data[field];
    });

    const newObra = await Obra.create(
      {
        ...obraData,
        codigo_inventario,
        id_artista,
        id_tecnica,
        id_estado_actual,
        id_categoria_obra: data.id_categoria_obra || null,
        anio: data.ano || data.anio,
        tipo_ingreso: data.tipo_ingreso,
        piezas: data.piezas || 1,
        peso: data.peso || null,
        descripcion: data.descripcion || null,
        ubicacion_actual: data.ubicacion || data.ubicacion_actual,
      },
      { transaction: t }
    );

    await t.commit();
    await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
    return newObra;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al crear la obra: ' + error.message, 500);
  }
};

exports.getAllObras = async (page, limit) => {
  const query = {
    include: [{ model: Artista, as: 'Artista' }, TecnicaObra, EstadoObra, CategoriaObra, Entrega],
    order: [['id_obra', 'DESC']],
  };

  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Obra.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }

  return await Obra.findAll(query);
};

exports.getObrasPublicas = async (page, limit) => {
  const query = {
    where: { mostrar_en_web: true },
    attributes: ['id_obra', 'titulo', 'anio', 'imagen_url', 'descripcion', 'medidas'],
    include: [
      { model: Artista, as: 'Artista', attributes: ['nombres', 'apellidos'] },
      { model: TecnicaObra, attributes: ['nombre_tecnica'] },
      { model: CategoriaObra, attributes: ['nombre_categoria'] },
      {
        model: ImagenWeb,
        attributes: ['url', 'titulo', 'descripcion'],
        where: { activo: true },
        required: false,
      },
    ],
    order: [['id_obra', 'DESC']],
  };

  if (page && limit) {
    const offset = (page - 1) * limit;
    query.limit = limit;
    query.offset = offset;
    const { count, rows } = await Obra.findAndCountAll(query);
    return {
      data: rows,
      meta: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page },
    };
  }

  return await Obra.findAll(query);
};

exports.getObraById = async (id) => {
  const obra = await Obra.findByPk(id, {
    include: [{ model: Artista, as: 'Artista' }, TecnicaObra, EstadoObra, CategoriaObra, Entrega],
  });
  if (!obra) throw new AppError('Obra no encontrada', 404);
  return obra;
};

exports.updateObra = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const fieldsToUpdate = {};

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        fieldsToUpdate[field] = data[field];
      }
    });

    if (Object.keys(fieldsToUpdate).length > 0) {
      await Obra.update(fieldsToUpdate, { where: { id_obra: id }, transaction: t });
    }

    await t.commit();
    await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');

    const obra = await Obra.findByPk(id, {
      include: [{ model: Artista, as: 'Artista' }, TecnicaObra, EstadoObra, CategoriaObra, Entrega],
    });
    return obra;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al actualizar la obra: ' + error.message, 500);
  }
};

exports.deleteObra = async (id) => {
  const obra = await Obra.findByPk(id);
  if (!obra) throw new AppError('Obra no encontrada', 404);
  const result = await obra.destroy();
  await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
  return result;
};
