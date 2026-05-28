const tecnicaService = require('../services/tecnicaObra.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createTecnica = catchAsync(async (req, res) => {
  const tecnica = await tecnicaService.createTecnica(req.body);
  res.status(201).json({ message: 'Técnica creada correctamente', data: tecnica });
});

exports.getAllTecnicas = catchAsync(async (req, res) => {
  const result = await tecnicaService.getAllTecnicas();
  res.status(200).json(result);
});

exports.getTecnicaById = catchAsync(async (req, res) => {
  const tecnica = await tecnicaService.getTecnicaById(req.params.id);
  res.status(200).json(tecnica);
});

exports.updateTecnica = catchAsync(async (req, res) => {
  const tecnica = await tecnicaService.updateTecnica(req.params.id, req.body);
  res.status(200).json({ message: 'Técnica actualizada correctamente', data: tecnica });
});

exports.deleteTecnica = catchAsync(async (req, res) => {
  await tecnicaService.deleteTecnica(req.params.id);
  res.status(200).json({ message: 'Técnica eliminada de la base de datos' });
});
