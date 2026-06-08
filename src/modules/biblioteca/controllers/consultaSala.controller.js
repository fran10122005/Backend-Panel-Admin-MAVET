const consultaService = require('../services/consultaSala.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createConsulta = catchAsync(async (req, res) => {
  const consulta = await consultaService.createConsulta(req.body);
  res.status(201).json({ message: 'Préstamo en sala registrado', data: consulta });
});

exports.getAllConsultas = catchAsync(async (req, res) => {
  const result = await consultaService.getAllConsultas();
  res.status(200).json(result);
});

exports.updateConsulta = catchAsync(async (req, res) => {
  const result = await consultaService.updateConsulta(req.params.id, req.body);
  res.status(200).json({ message: 'Consulta actualizada', data: result });
});
