const { MovimientoObra, Obra } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.registrarMovimiento = async (data) => {
  const obra = await Obra.findByPk(data.id_obra);
  if (!obra) throw new AppError('Obra no encontrada', 404);

  const movimiento = await MovimientoObra.create({
    id_obra: data.id_obra,
    tipo: data.tipo,
    descripcion: data.descripcion,
    fecha: data.fecha || new Date(),
    ubicacion_origen: data.ubicacion_origen || null,
    ubicacion_destino: data.ubicacion_destino || null,
    responsable: data.responsable || null,
    observaciones: data.observaciones || null,
  });

  if (data.ubicacion_destino) {
    await obra.update({ ubicacion_actual: data.ubicacion_destino });
  }

  return movimiento;
};

exports.obtenerHistorial = async (id_obra, page = 1, limit = 20) => {
  const obra = await Obra.findByPk(id_obra);
  if (!obra) throw new AppError('Obra no encontrada', 404);

  const offset = (page - 1) * limit;
  const { count, rows } = await MovimientoObra.findAndCountAll({
    where: { id_obra },
    order: [
      ['fecha', 'DESC'],
      ['created_at', 'DESC'],
    ],
    limit,
    offset,
  });

  return {
    data: rows,
    meta: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    },
  };
};

exports.obtenerMovimientoPorId = async (id) => {
  const movimiento = await MovimientoObra.findByPk(id);
  if (!movimiento) throw new AppError('Movimiento no encontrado', 404);
  return movimiento;
};
