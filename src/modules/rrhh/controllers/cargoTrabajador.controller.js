const cargoService = require('../services/cargoTrabajador.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createCargo = catchAsync(async (req, res) => {
  const cargo = await cargoService.createCargo(req.body);
  res.status(201).json({ message: 'Cargo creado correctamente', data: cargo });
});

exports.getAllCargos = catchAsync(async (req, res) => {
  const result = await cargoService.getAllCargos();
  res.status(200).json(result);
});

exports.getCargoById = catchAsync(async (req, res) => {
  const cargo = await cargoService.getCargoById(req.params.id);
  res.status(200).json(cargo);
});

exports.updateCargo = catchAsync(async (req, res) => {
  const cargo = await cargoService.updateCargo(req.params.id, req.body);
  res.status(200).json({ message: 'Cargo actualizado correctamente', data: cargo });
});

exports.deleteCargo = catchAsync(async (req, res) => {
  await cargoService.deleteCargo(req.params.id);
  res.status(200).json({ message: 'Cargo eliminado de la base de datos' });
});
