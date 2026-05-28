const turnoService = require('../services/turno.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createTurno = catchAsync(async (req, res) => {
  const turno = await turnoService.createTurno(req.body);
  res.status(201).json({ message: 'Turno creado correctamente', data: turno });
});

exports.getAllTurnos = catchAsync(async (req, res) => {
  const result = await turnoService.getAllTurnos();
  res.status(200).json(result);
});

exports.getTurnoById = catchAsync(async (req, res) => {
  const turno = await turnoService.getTurnoById(req.params.id);
  res.status(200).json(turno);
});

exports.updateTurno = catchAsync(async (req, res) => {
  const turno = await turnoService.updateTurno(req.params.id, req.body);
  res.status(200).json({ message: 'Turno actualizado correctamente', data: turno });
});

exports.deleteTurno = catchAsync(async (req, res) => {
  await turnoService.deleteTurno(req.params.id);
  res.status(200).json({ message: 'Turno eliminado de la base de datos' });
});
