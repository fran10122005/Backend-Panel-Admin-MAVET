const obraService = require('../services/obra.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createObra = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.imagen_url = `/uploads/${req.file.filename}`;
  }
  const obra = await obraService.createObra(data);
  res.status(201).json({ message: 'Obra creada correctamente', data: obra });
});

exports.getAllObras = catchAsync(async (req, res) => {
  const result = await obraService.getAllObras();
  res.status(200).json(result);
});

exports.getObrasPublicas = catchAsync(async (req, res) => {
  const result = await obraService.getObrasPublicas();
  res.status(200).json(result);
});

exports.getObraById = catchAsync(async (req, res) => {
  const obra = await obraService.getObraById(req.params.id);
  res.status(200).json(obra);
});

exports.updateObra = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.imagen_url = `/uploads/${req.file.filename}`;
  }
  const obra = await obraService.updateObra(req.params.id, data);
  res.status(200).json({ message: 'Obra actualizada correctamente', data: obra });
});

exports.deleteObra = catchAsync(async (req, res) => {
  await obraService.deleteObra(req.params.id);
  res.status(200).json({ message: 'Obra eliminada de la base de datos' });
});
