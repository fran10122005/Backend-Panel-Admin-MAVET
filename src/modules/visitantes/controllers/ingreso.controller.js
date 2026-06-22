const ingresoService = require('../services/ingreso.service');
const catchAsync = require('../../../utils/catchAsync');

exports.checkVisitante = catchAsync(async (req, res) => {
  const visitante = await ingresoService.checkVisitante(req.params.cedula);
  res.status(200).json({
    existe: !!visitante,
    visitante: visitante || null
  });
});

exports.registrarIngreso = catchAsync(async (req, res) => {
  const result = await ingresoService.registrarIngreso(req.body);
  res.status(201).json({
    message: 'Ingreso registrado correctamente',
    data: result
  });
});

exports.getAllIngresos = catchAsync(async (req, res) => {
  const ingresos = await ingresoService.getAllIngresos();
  res.status(200).json({
    message: 'Registros de ingreso obtenidos',
    data: ingresos
  });
});

exports.getStats = catchAsync(async (req, res) => {
  const stats = await ingresoService.getIngresosStats();
  res.status(200).json({
    message: 'Estadísticas obtenidas',
    data: stats
  });
});

exports.getTopVisitantes = catchAsync(async (req, res) => {
  const top = await ingresoService.getTopVisitantes();
  res.status(200).json({
    message: 'Top visitantes obtenidos',
    data: top
  });
});
