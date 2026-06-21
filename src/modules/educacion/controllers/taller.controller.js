const tallerService = require('../services/taller.service');
const { body, validationResult } = require('express-validator');
const catchAsync = require('../../../utils/catchAsync');

// Crear un taller programado con datos completos
exports.createTaller = catchAsync(async (req, res) => {
  const taller = await tallerService.createTaller(req.body);
  res.status(201).json({ message: 'Taller creado', data: taller });
});

// Planificar un taller a partir del inventario
exports.planificarTaller = catchAsync(async (req, res) => {
  const taller = await tallerService.planificarTaller(req.body);
  res.status(201).json({ message: 'Taller planificado', data: taller });
});

exports.getAllTalleres = catchAsync(async (req, res) => {
  const result = await tallerService.getAllTalleres();
  res.status(200).json(result);
});

exports.getTallerById = catchAsync(async (req, res) => {
  const taller = await tallerService.getTallerById(req.params.id);
  res.status(200).json(taller);
});

exports.updateTaller = catchAsync(async (req, res) => {
  const taller = await tallerService.updateTaller(req.params.id, req.body);
  res.status(200).json({ message: 'Taller actualizado', data: taller });
});

exports.deleteTaller = catchAsync(async (req, res) => {
  await tallerService.deleteTaller(req.params.id);
  res.status(200).json({ message: 'Taller eliminado' });
});
