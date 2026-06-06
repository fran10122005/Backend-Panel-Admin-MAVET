const { Obra, Artista, TecnicaObra, EstadoObra, Entrega } = require('../../../models');
const AppError = require('../../../utils/AppError');
const sequelize = require('../../../config/db');

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
    let tecnica = await TecnicaObra.findOne({ where: { nombre_tecnica: data.tecnica }, transaction });
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

    // Generate codigo_inventario if not provided
    let codigo_inventario = data.codigo_inventario || data.id;
    if (!codigo_inventario || codigo_inventario.startsWith('OBR-00')) {
      const count = await Obra.count({ transaction: t });
      codigo_inventario = `OBR-${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    }

    const newObra = await Obra.create({
      ...data,
      codigo_inventario,
      id_artista,
      id_tecnica,
      id_estado_actual,
      anio: data.ano || data.anio,
      tipo_ingreso: data.modalidad || data.tipo_ingreso,
      ubicacion_actual: data.ubicacion || data.ubicacion_actual
    }, { transaction: t });

    await t.commit();
    return newObra;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al crear la obra: ' + error.message, 500);
  }
};

exports.getAllObras = async () => {
  return await Obra.findAll({
    include: [Artista, TecnicaObra, EstadoObra, Entrega]
  });
};

exports.getObraById = async (id) => {
  const obra = await Obra.findByPk(id, {
    include: [Artista, TecnicaObra, EstadoObra, Entrega]
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

    await obra.update({
      ...data,
      id_artista: id_artista || obra.id_artista,
      id_tecnica: id_tecnica || obra.id_tecnica,
      id_estado_actual: id_estado_actual || obra.id_estado_actual,
      anio: data.ano || data.anio || obra.anio,
      tipo_ingreso: data.modalidad || data.tipo_ingreso || obra.tipo_ingreso,
      ubicacion_actual: data.ubicacion || data.ubicacion_actual || obra.ubicacion_actual
    }, { transaction: t });

    await t.commit();
    return obra;
  } catch (error) {
    await t.rollback();
    throw new AppError('Error al actualizar la obra: ' + error.message, 500);
  }
};

exports.deleteObra = async (id) => {
  const obra = await Obra.findByPk(id);
  if (!obra) throw new AppError('Obra no encontrada', 404);
  return await obra.destroy();
};
