const solicitudService = require('../services/solicitudEspacio.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createSolicitud = catchAsync(async (req, res) => {
  const solicitud = await solicitudService.createSolicitud(req.body, req.user);
  res.status(201).json({ message: 'Reserva creada exitosamente', data: solicitud });
});

exports.getAllSolicitudes = catchAsync(async (req, res) => {
  const result = await solicitudService.getAllSolicitudes();
  res.status(200).json(result);
});

exports.getSolicitudById = catchAsync(async (req, res) => {
  const solicitud = await solicitudService.getSolicitudById(req.params.id);
  res.status(200).json(solicitud);
});

exports.updateSolicitud = catchAsync(async (req, res) => {
  const solicitud = await solicitudService.updateSolicitud(req.params.id, req.body);
  res.status(200).json({ message: 'Reserva actualizada', data: solicitud });
});

exports.deleteSolicitud = catchAsync(async (req, res) => {
  await solicitudService.deleteSolicitud(req.params.id);
  res.status(200).json({ message: 'Reserva eliminada' });
});

// Funciones de aprobación y rechazo eliminadas
