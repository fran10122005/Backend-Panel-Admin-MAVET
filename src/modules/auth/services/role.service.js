const { Role } = require('../../../models');
const AppError = require('../../../utils/AppError');

exports.createRole = async (data) => {
  return await Role.create(data);
};

exports.getAllRoles = async () => {
  return await Role.findAll();
};

exports.getRoleById = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new AppError('Rol no encontrado', 404);
  return role;
};

exports.updateRole = async (id, data) => {
  const role = await Role.findByPk(id);
  if (!role) throw new AppError('Rol no encontrado', 404);
  return await role.update(data);
};

exports.deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) throw new AppError('Rol no encontrado', 404);
  return await role.destroy();
};
