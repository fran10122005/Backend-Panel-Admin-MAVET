const { Alumno, Representante } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createAlumno = async (data) => {
  return await Alumno.create(data);
};

exports.getAllAlumnos = async () => {
  return await Alumno.findAll({
    include: [Representante]
  });
};

exports.getAlumnoById = async (id) => {
  const alumno = await Alumno.findByPk(id, {
    include: [Representante]
  });
  if (!alumno) throw new AppError('Alumno no encontrado', 404);
  return alumno;
};

exports.updateAlumno = async (id, data) => {
  const alumno = await Alumno.findByPk(id);
  if (!alumno) throw new AppError('Alumno no encontrado', 404);
  return await alumno.update(data);
};

exports.deleteAlumno = async (id) => {
  const alumno = await Alumno.findByPk(id);
  if (!alumno) throw new AppError('Alumno no encontrado', 404);
  return await alumno.destroy();
};
