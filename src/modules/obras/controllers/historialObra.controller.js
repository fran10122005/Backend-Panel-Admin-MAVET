const historialObraService = require('../services/historialObra.service');
const catchAsync = require('../../../utils/catchAsync');

exports.registrarMovimiento = catchAsync(async (req, res) => {
  const movimiento = await historialObraService.registrarMovimiento({
    ...req.body,
    id_obra: req.params.id,
  });
  res.status(201).json({ message: 'Movimiento registrado', data: movimiento });
});

exports.obtenerHistorial = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await historialObraService.obtenerHistorial(req.params.id, page, limit);
  res.json({ data: result.data, meta: result.meta });
});

exports.obtenerMovimientoPorId = catchAsync(async (req, res) => {
  const movimiento = await historialObraService.obtenerMovimientoPorId(req.params.idMov);
  res.json({ data: movimiento });
});
