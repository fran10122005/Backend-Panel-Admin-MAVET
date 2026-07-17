const inventarioTallerService = require('../services/inventarioTaller.service');
const catchAsync = require('../../../utils/catchAsync');

exports.getAllInventario = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await inventarioTallerService.getAll(page, limit);
  res.status(200).json({
    data: result.data || result,
    meta: result.meta,
  });
});

exports.createInventario = catchAsync(async (req, res) => {
  const nuevo = await inventarioTallerService.create(req.body);
  res.status(201).json({ message: 'Inventario creado', data: nuevo });
});

exports.updateInventario = catchAsync(async (req, res) => {
  const actualizado = await inventarioTallerService.update(req.params.id, req.body);
  res.status(200).json({ message: 'Inventario actualizado', data: actualizado });
});

exports.deleteInventario = catchAsync(async (req, res) => {
  await inventarioTallerService.remove(req.params.id);
  res.status(200).json({ message: 'Taller eliminado del inventario' });
});
