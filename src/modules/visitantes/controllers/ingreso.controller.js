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
  const result = await ingresoService.getAllIngresos({
    page: req.query.page ? parseInt(req.query.page, 10) : null,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
    fecha: req.query.fecha || null,
    id_solicitud: req.query.id_solicitud || null,
    q: req.query.q || null,
    id_motivo: req.query.id_motivo || null,
    fecha_desde: req.query.fecha_desde || null,
    fecha_hasta: req.query.fecha_hasta || null,
  });
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
