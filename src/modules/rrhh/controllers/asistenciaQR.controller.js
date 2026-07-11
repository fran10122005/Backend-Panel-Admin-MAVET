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

exports.getSemanaAsistencia = catchAsync(async (req, res) => {
  const { cedulaTrabajador } = req.query;
  if (!cedulaTrabajador) {
    return res.status(400).json({ message: 'cedulaTrabajador es requerido' });
  }
  const data = await asistenciaQRService.getSemanaAsistencia(cedulaTrabajador);
  res.status(200).json({ status: 'success', data });
});

exports.updateAsistenciaObservaciones = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { observaciones, horas_justificadas } = req.body;
  if (observaciones === undefined || horas_justificadas === undefined) {
    return res.status(400).json({ message: 'observaciones y horas_justificadas son requeridos' });
  }
  const asistencia = await asistenciaQRService.updateObservaciones(
    id,
    observaciones,
    horas_justificadas
  );
  res.status(200).json({ status: 'success', data: asistencia });
});

exports.getResumenSemanalTodos = catchAsync(async (req, res) => {
  const resumen = await asistenciaQRService.getResumenSemanalTodos();
  res.status(200).json({ status: 'success', data: resumen });
});
