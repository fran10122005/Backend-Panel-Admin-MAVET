const { CategoriaObra } = require('../../../models');
const catchAsync = require('../../../utils/catchAsync');

exports.getAllCategorias = catchAsync(async (req, res) => {
  const categorias = await CategoriaObra.findAll();
  res.status(200).json(categorias);
});
