const inscripcionService = require('../services/inscripcionTaller.service');
const catchAsync = require('../../../utils/catchAsync');

exports.inscribirAlumno = catchAsync(async (req, res) => {
  const inscripcion = await inscripcionService.inscribirAlumno(req.body);
  res.status(201).json({ message: 'Alumno inscrito exitosamente', data: inscripcion });
});

exports.getAllInscripciones = catchAsync(async (req, res) => {
  const result = await inscripcionService.getInscripcionesConDetalles();
  res.status(200).json(result);
});
