const consultaService = require('../services/consultaSala.service');
const catchAsync = require('../../../utils/catchAsync');
const { consultaFiltrosSchema, estadisticasSchema } = require('../schemas/consultaSala.schema');

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

exports.getConsultasFiltradas = catchAsync(async (req, res) => {
  const filtros = consultaFiltrosSchema.parse(req.query);
  const result = await consultaService.getConsultasFiltradas(filtros);
  res.status(200).json(result);
});

exports.getEstadisticas = catchAsync(async (req, res) => {
  const params = estadisticasSchema.parse(req.query);
  const result = await consultaService.getEstadisticas(params.top);
  res.status(200).json(result);
});
