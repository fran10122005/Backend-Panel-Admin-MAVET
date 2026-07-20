const inscripcionService = require('../services/inscripcionTaller.service');
const catchAsync = require('../../../utils/catchAsync');
const { exportInscripciones } = require('../services/inscripcionTaller.service');

exports.inscribirAlumno = catchAsync(async (req, res) => {
  const inscripcion = await inscripcionService.inscribirAlumno(req.body);
  res.status(201).json({ message: 'Alumno inscrito exitosamente', data: inscripcion });
});

exports.getAllInscripciones = catchAsync(async (req, res) => {
  const result = await inscripcionService.getInscripcionesConDetalles();
  res.status(200).json(result);
});

exports.getInscripcionesByTaller = catchAsync(async (req, res) => {
  const { id } = req.params;
  const allInscripciones = await inscripcionService.getInscripcionesConDetalles();
  console.log('Filtering para taller:', id);
  console.log('Total inscripciones:', allInscripciones.length);
  const filtered = allInscripciones.filter((ins) => String(ins.id_taller) === String(id));
  console.log('Filtered length:', filtered.length);
  res.status(200).json(filtered);
});

exports.eliminarInscripcion = catchAsync(async (req, res) => {
  const result = await inscripcionService.eliminarInscripcion(req.params.id);
  res.status(200).json(result);
});

exports.actualizarInscripcion = catchAsync(async (req, res) => {
  const result = await inscripcionService.actualizarInscripcion(req.params.id, req.body);
  res.status(200).json({ message: 'Inscripción actualizada correctamente', data: result });
});

// New endpoint: export planilla for a specific taller
exports.exportPlanilla = catchAsync(async (req, res) => {
  const { id } = req.params; // taller id
  const { format } = req.query; // pdf or excel
  if (!['pdf', 'excel'].includes(format)) {
    return res.status(400).json({ message: 'Formato no soportado. Use pdf o excel.' });
  }
  const { buffer, filename, mimeType } = await exportInscripciones(id, format);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', mimeType);
  res.send(buffer);
});
