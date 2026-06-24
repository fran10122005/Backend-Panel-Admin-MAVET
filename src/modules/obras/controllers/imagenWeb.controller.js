const imagenWebService = require('../services/imagenWeb.service');
const catchAsync = require('../../../utils/catchAsync');

exports.getAll = catchAsync(async (req, res) => {
  const imagenes = await imagenWebService.getAll();
  res.json({ data: imagenes });
});

exports.getById = catchAsync(async (req, res) => {
  const imagen = await imagenWebService.getById(req.params.id);
  res.json({ data: imagen });
});

exports.create = catchAsync(async (req, res) => {
  const imagen = await imagenWebService.create(req.body);
  res.status(201).json({ message: 'Imagen creada correctamente', data: imagen });
});

exports.update = catchAsync(async (req, res) => {
  const imagen = await imagenWebService.update(req.params.id, req.body);
  res.json({ message: 'Imagen actualizada correctamente', data: imagen });
});

exports.remove = catchAsync(async (req, res) => {
  await imagenWebService.remove(req.params.id);
  res.json({ message: 'Imagen eliminada correctamente' });
});
