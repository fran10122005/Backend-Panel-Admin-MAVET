const { Instructor, Persona } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createInstructor = async (data) => {
  return await Instructor.create(data);
};

exports.getAllInstructores = async () => {
  return await Instructor.findAll({
    include: [Persona]
  });
};

exports.getInstructorById = async (id) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw new AppError('Instructor no encontrado', 404);
  return instructor;
};

exports.updateInstructor = async (id, data) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw new AppError('Instructor no encontrado', 404);
  return await instructor.update(data);
};

exports.deleteInstructor = async (id) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw new AppError('Instructor no encontrado', 404);
  return await instructor.destroy();
};
