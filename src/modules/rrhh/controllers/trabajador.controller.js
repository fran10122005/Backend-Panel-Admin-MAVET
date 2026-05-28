const trabajadorService = require('../services/trabajador.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createTrabajador = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.createTrabajador(req.body);
  res.status(201).json({ message: 'Trabajador creado correctamente', data: trabajador });
});

exports.getAllTrabajadores = catchAsync(async (req, res) => {
  const result = await trabajadorService.getAllTrabajadores();
  res.status(200).json(result);
});

exports.getTrabajadorById = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.getTrabajadorById(req.params.id);
  res.status(200).json(trabajador);
});

exports.updateTrabajador = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.updateTrabajador(req.params.id, req.body);
  res.status(200).json({ message: 'Trabajador actualizado correctamente', data: trabajador });
});

exports.deleteTrabajador = catchAsync(async (req, res) => {
  await trabajadorService.deleteTrabajador(req.params.id);
  res.status(200).json({ message: 'Trabajador eliminado de la base de datos' });
});
