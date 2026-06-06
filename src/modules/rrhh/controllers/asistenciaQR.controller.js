const asistenciaQRService = require('../services/asistenciaQR.service');
const catchAsync = require('../../../utils/catchAsync');

exports.registrarAsistencia = catchAsync(async (req, res) => {
  const asistencia = await asistenciaQRService.registrarAsistencia(req.body);
  res.status(201).json({ message: `Asistencia de ${req.body.tipoMovimiento} registrada con éxito.`, data: asistencia });
});

exports.getAllAsistencias = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.getAllAsistencias();
  res.status(200).json(result);
});
