const autorService = require('../services/autorLibro.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createAutor = catchAsync(async (req, res) => {
  const autor = await autorService.createAutor(req.body);
  res.status(201).json({ message: 'Autor creado', data: autor });
});

exports.getAllAutores = catchAsync(async (req, res) => {
  const result = await autorService.getAllAutores();
  res.status(200).json(result);
});

exports.getAutorById = catchAsync(async (req, res) => {
  const autor = await autorService.getAutorById(req.params.id);
  res.status(200).json(autor);
});

exports.updateAutor = catchAsync(async (req, res) => {
  const autor = await autorService.updateAutor(req.params.id, req.body);
  res.status(200).json({ message: 'Autor actualizado', data: autor });
});

exports.deleteAutor = catchAsync(async (req, res) => {
  await autorService.deleteAutor(req.params.id);
  res.status(200).json({ message: 'Autor eliminado' });
});
