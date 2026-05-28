const representanteService = require('../services/representante.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createRepresentante = catchAsync(async (req, res) => {
  const representante = await representanteService.createRepresentante(req.body);
  res.status(201).json({ message: 'Representante creado', data: representante });
});

exports.getAllRepresentantes = catchAsync(async (req, res) => {
  const result = await representanteService.getAllRepresentantes();
  res.status(200).json(result);
});

exports.getRepresentanteById = catchAsync(async (req, res) => {
  const representante = await representanteService.getRepresentanteById(req.params.id);
  res.status(200).json(representante);
});

exports.updateRepresentante = catchAsync(async (req, res) => {
  const representante = await representanteService.updateRepresentante(req.params.id, req.body);
  res.status(200).json({ message: 'Representante actualizado', data: representante });
});

exports.deleteRepresentante = catchAsync(async (req, res) => {
  await representanteService.deleteRepresentante(req.params.id);
  res.status(200).json({ message: 'Representante eliminado' });
});
