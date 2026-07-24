const tipoEventoService = require('../services/tipoEvento.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createTipoEvento = catchAsync(async (req, res) => {
  const tipo = await tipoEventoService.createTipoEvento(req.body);
  res.status(201).json({ message: 'Tipo de evento creado', data: tipo });
});

exports.getAllTiposEvento = catchAsync(async (req, res) => {
  const result = await tipoEventoService.getAllTiposEvento();
  res.status(200).json(result);
});

exports.getTipoEventoById = catchAsync(async (req, res) => {
  const tipo = await tipoEventoService.getTipoEventoById(req.params.id);
  res.status(200).json(tipo);
});

exports.updateTipoEvento = catchAsync(async (req, res) => {
  const tipo = await tipoEventoService.updateTipoEvento(req.params.id, req.body);
  res.status(200).json({ message: 'Tipo de evento actualizado', data: tipo });
});

exports.deleteTipoEvento = catchAsync(async (req, res) => {
  await tipoEventoService.deleteTipoEvento(req.params.id);
  res.status(200).json({ message: 'Tipo de evento eliminado' });
});
