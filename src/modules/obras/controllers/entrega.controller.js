const entregaService = require('../services/entrega.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createEntrega = catchAsync(async (req, res) => {
  const entrega = await entregaService.createEntrega(req.body);
  res.status(201).json({ message: 'Entrega creada correctamente', data: entrega });
});

exports.getAllEntregas = catchAsync(async (req, res) => {
  const result = await entregaService.getAllEntregas();
  res.status(200).json(result);
});

exports.getEntregaById = catchAsync(async (req, res) => {
  const entrega = await entregaService.getEntregaById(req.params.id);
  res.status(200).json(entrega);
});

exports.updateEntrega = catchAsync(async (req, res) => {
  const entrega = await entregaService.updateEntrega(req.params.id, req.body);
  res.status(200).json({ message: 'Entrega actualizada correctamente', data: entrega });
});

exports.deleteEntrega = catchAsync(async (req, res) => {
  await entregaService.deleteEntrega(req.params.id);
  res.status(200).json({ message: 'Entrega eliminada de la base de datos' });
});
