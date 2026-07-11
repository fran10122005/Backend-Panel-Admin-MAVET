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

const processForeignKeys = async (data, transaction) => {
  let id_artista = data.id_artista;
  let id_tecnica = data.id_tecnica;
  let id_estado_actual = data.id_estado_actual;

  // Process Artista from 'autor'
  if (data.autor) {
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

  // Process Tecnica from 'tecnica'
  if (data.tecnica) {
    let tecnica = await TecnicaObra.findOne({
      where: { nombre_tecnica: data.tecnica },
      transaction,
    });
    if (!tecnica) {
      tecnica = await TecnicaObra.create({ nombre_tecnica: data.tecnica }, { transaction });
    }
    id_tecnica = tecnica.id_tecnica;
  }

  // Process Estado from 'estado'
  if (data.estado) {
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

    const newObra = await Obra.create(
      {
        ...data,
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
    const obra = await Obra.findByPk(id, { transaction: t });
    if (!obra) throw new AppError('Obra no encontrada', 404);

    const { id_artista, id_tecnica, id_estado_actual } = await processForeignKeys(data, t);

    await obra.update(
      {
        ...data,
        id_artista: id_artista || obra.id_artista,
        id_tecnica: id_tecnica || obra.id_tecnica,
        id_estado_actual: id_estado_actual || obra.id_estado_actual,
        id_categoria_obra: data.id_categoria_obra || obra.id_categoria_obra,
        anio: data.ano || data.anio || obra.anio,
        tipo_ingreso: data.tipo_ingreso || obra.tipo_ingreso,
        piezas: data.piezas || obra.piezas,
        peso: data.peso || obra.peso,
        descripcion: data.descripcion || obra.descripcion,
        ubicacion_actual: data.ubicacion || data.ubicacion_actual || obra.ubicacion_actual,
      },
      { transaction: t }
    );

    await t.commit();
    await cacheService.eliminarPatron('mavet:resp:/api/public/obras*');
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
