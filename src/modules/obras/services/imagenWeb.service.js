const { ImagenWeb, Obra } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.getAll = async () => {
  return await ImagenWeb.findAll({
    include: [{ model: Obra, attributes: ['titulo', 'codigo_inventario'] }],
    order: [
      ['orden', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });
};

exports.getById = async (id) => {
  const img = await ImagenWeb.findByPk(id, {
    include: [{ model: Obra, attributes: ['titulo', 'codigo_inventario'] }],
  });
  if (!img) throw new AppError('Imagen no encontrada', 404);
  return img;
};

exports.create = async (data) => {
  const obra = await Obra.findByPk(data.id_obra);
  if (!obra) throw new AppError('La obra especificada no existe', 404);
  const existente = await ImagenWeb.findOne({ where: { id_obra: data.id_obra } });
  if (existente) throw new AppError('Esta obra ya tiene una imagen asignada', 409);
  return await ImagenWeb.create(data);
};

exports.update = async (id, data) => {
  const img = await ImagenWeb.findByPk(id);
  if (!img) throw new AppError('Imagen no encontrada', 404);
  if (data.id_obra && data.id_obra !== img.id_obra) {
    const obra = await Obra.findByPk(data.id_obra);
    if (!obra) throw new AppError('La obra especificada no existe', 404);
    const existente = await ImagenWeb.findOne({ where: { id_obra: data.id_obra } });
    if (existente) throw new AppError('La obra destino ya tiene una imagen asignada', 409);
  }
  await img.update(data);
  return img;
};

exports.getPublicas = async (seccion) => {
  const where = { activo: true };
  if (seccion) where.seccion = seccion;
  return await ImagenWeb.findAll({
    where,
    include: [{ model: Obra, attributes: ['titulo', 'codigo_inventario'] }],
    order: [
      ['orden', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });
};

exports.remove = async (id) => {
  const img = await ImagenWeb.findByPk(id);
  if (!img) throw new AppError('Imagen no encontrada', 404);
  await img.destroy();
};
