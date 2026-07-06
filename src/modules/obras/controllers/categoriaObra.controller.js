const categoriaService = require('../services/categoriaObra.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createCategoria = catchAsync(async (req, res) => {
  const categoria = await categoriaService.createCategoria(req.body);
  res.status(201).json({ message: 'Categoría creada correctamente', data: categoria });
});

exports.getAllCategorias = catchAsync(async (req, res) => {
  const result = await categoriaService.getAllCategorias();
  res.status(200).json(result);
});

exports.getCategoriaById = catchAsync(async (req, res) => {
  const categoria = await categoriaService.getCategoriaById(req.params.id);
  res.status(200).json(categoria);
});

exports.updateCategoria = catchAsync(async (req, res) => {
  const categoria = await categoriaService.updateCategoria(req.params.id, req.body);
  res.status(200).json({ message: 'Categoría actualizada correctamente', data: categoria });
});

exports.deleteCategoria = catchAsync(async (req, res) => {
  await categoriaService.deleteCategoria(req.params.id);
  res.status(200).json({ message: 'Categoría eliminada de la base de datos' });
});
