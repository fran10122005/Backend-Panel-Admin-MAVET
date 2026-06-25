const asistenciaQRService = require('../services/asistenciaQR.service');
const catchAsync = require('../../../utils/catchAsync');

exports.registrarAsistencia = catchAsync(async (req, res) => {
  const asistencia = await asistenciaQRService.registrarAsistencia(req.body);
  res.status(201).json({
    message: `Asistencia de ${req.body.tipoMovimiento} registrada con éxito.`,
    data: asistencia,
  });
});

exports.getAllAsistencias = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await asistenciaQRService.getAllAsistencias(page, limit);
  res.status(200).json({
    data: result.data || result,
    meta: result.meta,
  });
});
