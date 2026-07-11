const { Instructor, Persona } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createInstructor = async (data) => {
  if (data.id_persona) {
    const existing = await Instructor.findOne({ where: { id_persona: data.id_persona } });
    if (existing) {
      throw new AppError('Esta persona ya está registrada como instructor', 400);
    }
  }
  return await Instructor.create(data);
};

exports.getAllInstructores = async () => {
  return await Instructor.findAll({
    include: [Persona],
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

  if (data.id_persona && data.id_persona !== instructor.id_persona) {
    const existing = await Instructor.findOne({ where: { id_persona: data.id_persona } });
    if (existing) {
      throw new AppError('Esta persona ya está registrada como instructor', 400);
    }
  }
  return await instructor.update(data);
};

exports.deleteInstructor = async (id) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw new AppError('Instructor no encontrado', 404);
  return await instructor.destroy();
};
