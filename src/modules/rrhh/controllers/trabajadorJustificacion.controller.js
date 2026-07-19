const trabajadorJustificacionService = require('../services/trabajadorJustificacion.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

exports.crearJustificacion = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const datos = req.body;
  const file = req.file;

  const justificacion = await trabajadorJustificacionService.crearJustificacion(
    id_trabajador,
    datos,
    file
  );

  res.status(201).json({
    status: 'success',
    data: justificacion,
  });
});

exports.obtenerJustificaciones = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const filtros = req.query;
  const justificaciones = await trabajadorJustificacionService.obtenerJustificaciones(
    id_trabajador,
    filtros
  );

  res.status(200).json({
    status: 'success',
    data: justificaciones,
  });
});

exports.obtenerTipos = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: trabajadorJustificacionService.TIPOS_JUSTIFICACION,
  });
});

exports.obtenerEstados = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: trabajadorJustificacionService.ESTADOS,
  });
});

exports.obtenerEstadisticas = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const stats =
    await trabajadorJustificacionService.obtenerEstadisticasJustificaciones(id_trabajador);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.obtenerJustificacionPorId = catchAsync(async (req, res) => {
  const { id_justificacion } = req.params;
  const justificacion =
    await trabajadorJustificacionService.obtenerJustificacionPorId(id_justificacion);

  res.status(200).json({
    status: 'success',
    data: justificacion,
  });
});

exports.actualizarEstado = catchAsync(async (req, res) => {
  const { id_justificacion } = req.params;
  const { estado, observaciones } = req.body;
  const revisada_por = req.user?.id_usuario;

  const justificacion = await trabajadorJustificacionService.actualizarEstadoJustificacion(
    id_justificacion,
    estado,
    revisada_por,
    observaciones
  );

  res.status(200).json({
    status: 'success',
    data: justificacion,
  });
});

exports.eliminarJustificacion = catchAsync(async (req, res) => {
  const { id_justificacion } = req.params;
  await trabajadorJustificacionService.eliminarJustificacion(id_justificacion);

  res.status(200).json({
    status: 'success',
    message: 'Justificación eliminada',
  });
});
