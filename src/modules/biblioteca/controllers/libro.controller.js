const libroService = require('../services/libro.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createLibro = catchAsync(async (req, res) => {
  const libro = await libroService.createLibro(req.body);
  res.status(201).json({ message: 'Libro creado', data: libro });
});

exports.getAllLibros = catchAsync(async (req, res) => {
  const result = await libroService.getAllLibros();
  res.status(200).json(result);
});

exports.getLibroById = catchAsync(async (req, res) => {
  const libro = await libroService.getLibroById(req.params.id);
  res.status(200).json(libro);
});

exports.updateLibro = catchAsync(async (req, res) => {
  const libro = await libroService.updateLibro(req.params.id, req.body);
  res.status(200).json({ message: 'Libro actualizado', data: libro });
});

exports.deleteLibro = catchAsync(async (req, res) => {
  await libroService.deleteLibro(req.params.id);
  res.status(200).json({ message: 'Libro eliminado' });
});
