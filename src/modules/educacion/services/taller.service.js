const { Taller, Instructor, EspacioMuseo, InventarioTaller } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTaller = async (data) => {
  return await Taller.create(data);
};

/**
 * Planificar un taller a partir de un inventario existente.
 * @param {{ inventarioId: number, fecha: string, hora_inicio: string, hora_fin: string, sesiones?: number, cupo_minimo?: number, cupo_maximo?: number, horas_totales?: number, id_instructor?: number, id_espacio?: number }} data
 */
exports.planificarTaller = async (data) => {
  const { inventarioId, ...rest } = data;
  const inventario = await InventarioTaller.findByPk(inventarioId);
  if (!inventario) {
    throw new AppError('Inventario de taller no encontrado', 404);
  }
  // Map inventory name to taller's nombre_curso field.
  const tallerData = {
    nombre_curso: inventario.nombre,
    ...rest
  };
  return await Taller.create(tallerData);
};

exports.getAllTalleres = async () => {
  return await Taller.findAll({
    include: [Instructor, EspacioMuseo]
  });
};

exports.getTallerById = async (id) => {
  const taller = await Taller.findByPk(id, {
    include: [Instructor, EspacioMuseo]
  });
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return taller;
};

exports.updateTaller = async (id, data) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return await taller.update(data);
};

exports.deleteTaller = async (id) => {
  const taller = await Taller.findByPk(id);
  if (!taller) throw new AppError('Taller no encontrado', 404);
  return await taller.destroy();
};
