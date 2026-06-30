const sesionService = require('../services/sesionTaller.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createSesion = catchAsync(async (req, res) => {
  const { id_taller } = req.params;
  const { fecha, tema_impartido } = req.body;
  if (!fecha || !tema_impartido) {
    return res.status(400).json({ status: 'fail', message: 'Falta fecha o tema_impartido' });
  }
  const sesion = await sesionService.createSesion(id_taller, fecha, tema_impartido);
  res.status(201).json({ status: 'success', data: sesion, message: 'Sesión creada exitosamente' });
});

exports.getSesionesByTaller = catchAsync(async (req, res) => {
  const { id_taller } = req.params;
  const sesiones = await sesionService.getSesionesByTaller(id_taller);
  res.status(200).json({ status: 'success', data: sesiones });
});

exports.getAsistenciaSesion = catchAsync(async (req, res) => {
  const { id_sesion } = req.params;
  const asistencia = await sesionService.getAsistenciaSesion(id_sesion);
  res.status(200).json({ status: 'success', data: asistencia });
});

exports.saveAsistencia = catchAsync(async (req, res) => {
  const { id_sesion } = req.params;
  const { asistencias } = req.body; // Array de { id_alumno, asistio }
  if (!Array.isArray(asistencias)) {
    return res.status(400).json({ status: 'fail', message: 'asistencias debe ser un arreglo' });
  }
  await sesionService.saveAsistencia(id_sesion, asistencias);
  res.status(200).json({ status: 'success', message: 'Asistencia guardada exitosamente' });
});

exports.getMetricasTaller = catchAsync(async (req, res) => {
  const { id_taller } = req.params;
  const metricas = await sesionService.getMetricasTaller(id_taller);
  res.status(200).json({ status: 'success', data: metricas });
});
