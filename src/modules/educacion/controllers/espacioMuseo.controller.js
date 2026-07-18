const espacioService = require('../services/espacioMuseo.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createEspacio = catchAsync(async (req, res) => {
  const espacio = await espacioService.createEspacio(req.body, req.user);
  res.status(201).json({ message: 'Espacio creado', data: espacio });
});

exports.getAllEspacios = catchAsync(async (req, res) => {
  const result = await espacioService.getAllEspacios();
  res.status(200).json(result);
});

exports.getEspacioById = catchAsync(async (req, res) => {
  const espacio = await espacioService.getEspacioById(req.params.id);
  res.status(200).json(espacio);
});

exports.updateEspacio = catchAsync(async (req, res) => {
  const espacio = await espacioService.updateEspacio(req.params.id, req.body, req.user);
  res.status(200).json({ message: 'Espacio actualizado', data: espacio });
});

exports.deleteEspacio = catchAsync(async (req, res) => {
  await espacioService.deleteEspacio(req.params.id, req.user);
  res.status(200).json({ message: 'Espacio eliminado' });
});
