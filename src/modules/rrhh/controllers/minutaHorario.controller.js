const minutaHorarioService = require('../services/minutaHorario.service');
const catchAsync = require('../../../utils/catchAsync');

exports.subirMinuta = catchAsync(async (req, res) => {
  console.log('[Minuta] POST recibido para trabajador:', req.params.id_trabajador);
  console.log(
    '[Minuta] File:',
    req.file
      ? { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype }
      : 'NO FILE'
  );
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo' });
  }
  const result = await minutaHorarioService.subirMinuta(req.params.id_trabajador, req.file);
  console.log('[Minuta] Subida exitosa:', result.url);
  res.status(200).json({ message: 'Minuta de horario subida correctamente', data: result });
});

exports.obtenerMinuta = catchAsync(async (req, res) => {
  const result = await minutaHorarioService.obtenerMinuta(req.params.id_trabajador);
  if (!result) {
    return res.status(404).json({ message: 'No hay minuta de horario registrada' });
  }
  res.status(200).json({ data: result });
});

exports.eliminarMinuta = catchAsync(async (req, res) => {
  await minutaHorarioService.eliminarMinuta(req.params.id_trabajador);
  res.status(200).json({ message: 'Minuta de horario eliminada correctamente' });
});
