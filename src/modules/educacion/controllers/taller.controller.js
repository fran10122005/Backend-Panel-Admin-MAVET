const tallerService = require('../services/taller.service');
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
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await tallerService.getAllTalleres(page, limit);
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

exports.subirDocumentoPlan = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún documento' });
  }
  const documentoUrl = `/uploads/documents/${req.file.filename}`;
  const taller = await tallerService.updateDocumentoPlan(req.params.id, documentoUrl);
  res.status(200).json({ message: 'Documento subido con éxito', data: taller });
});

exports.getDocumentoPlan = catchAsync(async (req, res) => {
  const filePath = await tallerService.getDocumentoPlanPath(req.params.id);
  if (!filePath) {
    return res.status(404).json({ message: 'Documento no encontrado' });
  }
  res.download(filePath);
});
