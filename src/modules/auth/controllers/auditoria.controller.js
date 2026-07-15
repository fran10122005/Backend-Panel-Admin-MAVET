const auditoriaService = require('../services/auditoria.service');
const catchAsync = require('../../../utils/catchAsync');

exports.listar = catchAsync(async (req, res) => {
  const { page, limit, tipo, desde, hasta } = req.query;
  const result = await auditoriaService.listar({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 25,
    tipo,
    desde,
    hasta,
  });

  res.status(200).json({ status: 'success', ...result });
});
