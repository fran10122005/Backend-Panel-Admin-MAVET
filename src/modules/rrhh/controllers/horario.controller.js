const horarioService = require('../services/horario.service');
const catchAsync = require('../../../utils/catchAsync');

exports.reporteSemanal = catchAsync(async (req, res) => {
  const reporte = await horarioService.reporteSemanal();
  res.status(200).json(reporte);
});

exports.actualizarHorasSemanales = catchAsync(async (req, res) => {
  const { horas_nuevas, motivo } = req.body;
  const id_usuario_modifica = req.usuario?.id_usuario;
  const trabajador = await horarioService.actualizarHorasSemanales(
    req.params.id,
    horas_nuevas,
    motivo,
    id_usuario_modifica
  );
  res.status(200).json({ message: 'Horas semanales actualizadas correctamente', data: trabajador });
});

exports.obtenerHistorial = catchAsync(async (req, res) => {
  const historial = await horarioService.obtenerHistorial(req.params.id);
  res.status(200).json(historial);
});
