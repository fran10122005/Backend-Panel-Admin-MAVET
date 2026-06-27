const trabajadorService = require('../services/trabajador.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createTrabajador = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.createTrabajador(req.body);
  res.status(201).json({ message: 'Trabajador creado correctamente', data: trabajador });
});

exports.getAllTrabajadores = catchAsync(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const result = await trabajadorService.getAllTrabajadores(page, limit);
  res.status(200).json({
    data: result.data || result,
    meta: result.meta,
  });
});

exports.getTrabajadorById = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.getTrabajadorById(req.params.id);
  res.status(200).json(trabajador);
});

exports.updateTrabajador = catchAsync(async (req, res) => {
  const trabajador = await trabajadorService.updateTrabajador(req.params.id, req.body);
  res.status(200).json({ message: 'Trabajador actualizado correctamente', data: trabajador });
});

exports.deleteTrabajador = catchAsync(async (req, res) => {
  await trabajadorService.deleteTrabajador(req.params.id);
  res.status(200).json({ message: 'Trabajador eliminado de la base de datos' });
});

exports.subirFoto = catchAsync(async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '../../../../upload_debug.log');
  const logData = `
--- DEBUG SUBIR FOTO ---
Timestamp: ${new Date().toISOString()}
Headers: ${JSON.stringify(req.headers, null, 2)}
File: ${JSON.stringify(req.file, null, 2)}
Body: ${JSON.stringify(req.body, null, 2)}
------------------------
`;
  fs.appendFileSync(logPath, logData);

  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No se envió ninguna imagen' });
  }
  const url = await trabajadorService.subirFotoTrabajador(req.params.id, req.file.path);
  res.status(200).json({ status: 'success', url });
});
