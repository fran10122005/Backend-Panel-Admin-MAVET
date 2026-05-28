const estadoService = require('../services/estadoObra.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createEstado = catchAsync(async (req, res) => {
  const estado = await estadoService.createEstado(req.body);
  res.status(201).json({ message: 'Estado creado correctamente', data: estado });
});

exports.getAllEstados = catchAsync(async (req, res) => {
  const result = await estadoService.getAllEstados();
  res.status(200).json(result);
});

exports.getEstadoById = catchAsync(async (req, res) => {
  const estado = await estadoService.getEstadoById(req.params.id);
  res.status(200).json(estado);
});

exports.updateEstado = catchAsync(async (req, res) => {
  const estado = await estadoService.updateEstado(req.params.id, req.body);
  res.status(200).json({ message: 'Estado actualizado correctamente', data: estado });
});

exports.deleteEstado = catchAsync(async (req, res) => {
  await estadoService.deleteEstado(req.params.id);
  res.status(200).json({ message: 'Estado eliminado de la base de datos' });
});
