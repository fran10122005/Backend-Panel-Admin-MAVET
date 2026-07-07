const ingresoService = require('../services/ingreso.service');
const catchAsync = require('../../../utils/catchAsync');

exports.checkVisitante = catchAsync(async (req, res) => {
  const visitante = await ingresoService.checkVisitante(req.params.cedula);
  res.status(200).json({
    existe: !!visitante,
    visitante: visitante || null,
  });
});

exports.registrarIngreso = catchAsync(async (req, res) => {
  const result = await ingresoService.registrarIngreso(req.body);
  res.status(201).json({
    message: 'Ingreso registrado correctamente',
    data: result,
  });
});

exports.getAllIngresos = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const fecha = req.query.fecha || null;
  const id_solicitud = req.query.id_solicitud || null;
  const result = await ingresoService.getAllIngresos(page, limit, fecha, id_solicitud);
  res.status(200).json({
    message: 'Registros de ingreso obtenidos',
    data: result.data || result,
    meta: result.meta,
  });
});

exports.getStats = catchAsync(async (req, res) => {
  const stats = await ingresoService.getIngresosStats();
  res.status(200).json({
    message: 'Estadísticas obtenidas',
    data: stats,
  });
});

exports.getTopVisitantes = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const top = await ingresoService.getTopVisitantes(limit);
  res.status(200).json({
    message: 'Top visitantes obtenidos',
    data: top,
  });
});
