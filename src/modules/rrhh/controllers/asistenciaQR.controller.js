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
  const fecha = req.query.fecha || null;
  const result = await asistenciaQRService.getAllAsistencias(page, limit, fecha);
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
  if (observaciones === undefined) {
    return res.status(400).json({ message: 'observaciones es requerido' });
  }
  const asistencia = await asistenciaQRService.updateObservaciones(
    id,
    observaciones,
    horas_justificadas
  );
  res.status(200).json({ status: 'success', data: asistencia });
});

exports.justificarSemana = catchAsync(async (req, res) => {
  const { cedula, observaciones, horas_justificadas } = req.body;
  if (!cedula || horas_justificadas === undefined) {
    return res.status(400).json({ message: 'cedula y horas_justificadas son requeridos' });
  }
  const asistencia = await asistenciaQRService.justificarSemana({
    cedula,
    observaciones,
    horas_justificadas,
  });
  res.status(200).json({ status: 'success', data: asistencia });
});

exports.getResumenSemanalTodos = catchAsync(async (req, res) => {
  const resumen = await asistenciaQRService.getResumenSemanalTodos();
  res.status(200).json({ status: 'success', data: resumen });
});

exports.verificarPin = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.verificarPin(req.body, req);
  res.status(200).json({ status: 'success', data: result });
});

exports.confirmarAsistencia = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.confirmarAsistencia(req.body, req);
  res.status(200).json({ status: 'success', data: result });
});

exports.cambiarPin = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.cambiarPin(req.body, req);
  res.status(200).json({ status: 'success', data: result });
});

exports.resetPinTrabajador = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.resetPinTrabajador(req.params.id, req);
  res.status(200).json({ status: 'success', data: result });
});

exports.verificarFacial = catchAsync(async (req, res) => {
  const result = await asistenciaQRService.verificarFacial(req.body, req);
  res.status(200).json({ status: 'success', data: result });
});
