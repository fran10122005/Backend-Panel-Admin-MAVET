const trabajadorHorarioService = require('../services/trabajadorHorario.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

exports.crearHorario = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const { dia_semana, hora_entrada, hora_salida, es_dia_laborable, observaciones } = req.body;

  if (dia_semana === undefined || dia_semana < 0 || dia_semana > 6) {
    throw new AppError('Día de la semana inválido (0-6)', 400);
  }

  const horario = await trabajadorHorarioService.crearHorario(id_trabajador, {
    dia_semana,
    hora_entrada,
    hora_salida,
    es_dia_laborable,
    observaciones,
  });

  res.status(201).json({
    status: 'success',
    data: horario,
  });
});

exports.crearHorariosCompletos = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const horarios = await trabajadorHorarioService.crearHorariosCompletos(id_trabajador);

  res.status(201).json({
    status: 'success',
    data: horarios,
    message:
      'Horarios por defecto creados (Lunes-Viernes laborables, Sábado-Domingo no laborables)',
  });
});

exports.obtenerHorarios = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const horarios = await trabajadorHorarioService.obtenerHorarios(id_trabajador);

  res.status(200).json({
    status: 'success',
    data: horarios,
  });
});

exports.obtenerHorariosCompletos = catchAsync(async (req, res) => {
  const { id_trabajador } = req.params;
  const horarios = await trabajadorHorarioService.obtenerHorariosCompletos(id_trabajador);

  res.status(200).json({
    status: 'success',
    data: horarios,
  });
});

exports.actualizarHorario = catchAsync(async (req, res) => {
  const { id_trabajador, dia_semana } = req.params;
  const { hora_entrada, hora_salida, es_dia_laborable, observaciones } = req.body;

  const horario = await trabajadorHorarioService.actualizarHorario(
    id_trabajador,
    parseInt(dia_semana),
    {
      hora_entrada,
      hora_salida,
      es_dia_laborable,
      observaciones,
    }
  );

  res.status(200).json({
    status: 'success',
    data: horario,
  });
});

exports.eliminarHorario = catchAsync(async (req, res) => {
  const { id_trabajador, dia_semana } = req.params;
  await trabajadorHorarioService.eliminarHorario(id_trabajador, parseInt(dia_semana));

  res.status(200).json({
    status: 'success',
    message: 'Horario eliminado',
  });
});

exports.obtenerDiasSemana = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: trabajadorHorarioService.DIAS_SEMANA,
  });
});
