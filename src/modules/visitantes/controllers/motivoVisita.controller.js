const motivoService = require('../services/motivoVisita.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createMotivo = catchAsync(async (req, res) => {
  const motivo = await motivoService.createMotivo(req.body);
  res.status(201).json({ message: 'Motivo creado', data: motivo });
});

exports.getAllMotivos = catchAsync(async (req, res) => {
  const result = await motivoService.getAllMotivos();
  res.status(200).json(result);
});

exports.getMotivoById = catchAsync(async (req, res) => {
  const motivo = await motivoService.getMotivoById(req.params.id);
  res.status(200).json(motivo);
});

exports.updateMotivo = catchAsync(async (req, res) => {
  const motivo = await motivoService.updateMotivo(req.params.id, req.body);
  res.status(200).json({ message: 'Motivo actualizado', data: motivo });
});

exports.deleteMotivo = catchAsync(async (req, res) => {
  await motivoService.deleteMotivo(req.params.id);
  res.status(200).json({ message: 'Motivo eliminado' });
});
