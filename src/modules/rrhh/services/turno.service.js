const { Turno } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTurno = async (data) => {
  return await Turno.create(data);
};

exports.getAllTurnos = async () => {
  return await Turno.findAll();
};

exports.getTurnoById = async (id) => {
  const turno = await Turno.findByPk(id);
  if (!turno) throw new AppError('Turno no encontrado', 404);
  return turno;
};

exports.updateTurno = async (id, data) => {
  const turno = await Turno.findByPk(id);
  if (!turno) throw new AppError('Turno no encontrado', 404);
  return await turno.update(data);
};

exports.deleteTurno = async (id) => {
  const turno = await Turno.findByPk(id);
  if (!turno) throw new AppError('Turno no encontrado', 404);
  return await turno.destroy();
};
