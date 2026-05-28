const { Trabajador, CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createTrabajador = async (data) => {
  return await Trabajador.create(data);
};

exports.getAllTrabajadores = async () => {
  return await Trabajador.findAll({
    include: [{ model: CargoTrabajador }]
  });
};

exports.getTrabajadorById = async (id) => {
  const trabajador = await Trabajador.findByPk(id, {
    include: [{ model: CargoTrabajador }]
  });
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return trabajador;
};

exports.updateTrabajador = async (id, data) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return await trabajador.update(data);
};

exports.deleteTrabajador = async (id) => {
  const trabajador = await Trabajador.findByPk(id);
  if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
  return await trabajador.destroy();
};
