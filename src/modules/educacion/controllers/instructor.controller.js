const instructorService = require('../services/instructor.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createInstructor = catchAsync(async (req, res) => {
  const instructor = await instructorService.createInstructor(req.body);
  res.status(201).json({ message: 'Instructor creado', data: instructor });
});

exports.getAllInstructores = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || null;
  const limit = parseInt(req.query.limit) || null;
  const result = await instructorService.getAllInstructores(page, limit);
  res.status(200).json(result);
});

exports.getInstructorById = catchAsync(async (req, res) => {
  const instructor = await instructorService.getInstructorById(req.params.id);
  res.status(200).json(instructor);
});

exports.updateInstructor = catchAsync(async (req, res) => {
  const instructor = await instructorService.updateInstructor(req.params.id, req.body);
  res.status(200).json({ message: 'Instructor actualizado', data: instructor });
});

exports.deleteInstructor = catchAsync(async (req, res) => {
  await instructorService.deleteInstructor(req.params.id);
  res.status(200).json({ message: 'Instructor eliminado' });
});
