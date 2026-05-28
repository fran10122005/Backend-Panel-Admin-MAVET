const alumnoService = require('../services/alumno.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createAlumno = catchAsync(async (req, res) => {
  const alumno = await alumnoService.createAlumno(req.body);
  res.status(201).json({ message: 'Alumno creado', data: alumno });
});

exports.getAllAlumnos = catchAsync(async (req, res) => {
  const result = await alumnoService.getAllAlumnos();
  res.status(200).json(result);
});

exports.getAlumnoById = catchAsync(async (req, res) => {
  const alumno = await alumnoService.getAlumnoById(req.params.id);
  res.status(200).json(alumno);
});

exports.updateAlumno = catchAsync(async (req, res) => {
  const alumno = await alumnoService.updateAlumno(req.params.id, req.body);
  res.status(200).json({ message: 'Alumno actualizado', data: alumno });
});

exports.deleteAlumno = catchAsync(async (req, res) => {
  await alumnoService.deleteAlumno(req.params.id);
  res.status(200).json({ message: 'Alumno eliminado' });
});
