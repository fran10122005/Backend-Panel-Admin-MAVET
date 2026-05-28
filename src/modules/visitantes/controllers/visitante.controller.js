const visitanteService = require('../services/visitante.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createVisitante = catchAsync(async (req, res) => {
  const visitante = await visitanteService.createVisitante(req.body);
  res.status(201).json({ message: 'Visitante creado', data: visitante });
});

exports.getAllVisitantes = catchAsync(async (req, res) => {
  const result = await visitanteService.getAllVisitantes();
  res.status(200).json(result);
});

exports.getVisitanteById = catchAsync(async (req, res) => {
  const visitante = await visitanteService.getVisitanteById(req.params.id);
  res.status(200).json(visitante);
});

exports.updateVisitante = catchAsync(async (req, res) => {
  const visitante = await visitanteService.updateVisitante(req.params.id, req.body);
  res.status(200).json({ message: 'Visitante actualizado', data: visitante });
});

exports.deleteVisitante = catchAsync(async (req, res) => {
  await visitanteService.deleteVisitante(req.params.id);
  res.status(200).json({ message: 'Visitante eliminado' });
});
