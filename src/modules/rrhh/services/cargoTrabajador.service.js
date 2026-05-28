const { CargoTrabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createCargo = async (data) => {
  return await CargoTrabajador.create(data);
};

exports.getAllCargos = async () => {
  return await CargoTrabajador.findAll();
};

exports.getCargoById = async (id) => {
  const cargo = await CargoTrabajador.findByPk(id);
  if (!cargo) throw new AppError('Cargo no encontrado', 404);
  return cargo;
};

exports.updateCargo = async (id, data) => {
  const cargo = await CargoTrabajador.findByPk(id);
  if (!cargo) throw new AppError('Cargo no encontrado', 404);
  return await cargo.update(data);
};

exports.deleteCargo = async (id) => {
  const cargo = await CargoTrabajador.findByPk(id);
  if (!cargo) throw new AppError('Cargo no encontrado', 404);
  return await cargo.destroy();
};
