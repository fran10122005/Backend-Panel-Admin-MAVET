const asistenciaQRService = require('../services/asistenciaQR.service');
const catchAsync = require('../../../utils/catchAsync');

exports.registrarAsistencia = catchAsync(async (req, res) => {
  const asistencia = await asistenciaQRService.registrarAsistencia(req.body);
  res.status(201).json({
    message: `Asistencia de ${req.body.tipoMovimiento} registrada con éxito.`,
    data: asistencia,
  });
});

exports.getEstadoAsistencia = catchAsync(async (req, res) => {
  const { qr_uuid, cedulaTrabajador } = req.query;
  const estado = await asistenciaQRService.getEstadoAsistencia({ qr_uuid, cedulaTrabajador });
  res.status(200).json({ status: 'success', data: estado });
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
