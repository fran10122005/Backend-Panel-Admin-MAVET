const roleService = require('../services/role.service');
const catchAsync = require('../../../utils/catchAsync');

exports.createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({ message: 'Rol creado', data: role });
});

exports.getAllRoles = catchAsync(async (req, res) => {
  const result = await roleService.getAllRoles();
  res.status(200).json(result);
});

exports.getRoleById = catchAsync(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.status(200).json(role);
});

exports.updateRole = catchAsync(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(200).json({ message: 'Rol actualizado', data: role });
});

exports.deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  res.status(200).json({ message: 'Rol eliminado' });
});
