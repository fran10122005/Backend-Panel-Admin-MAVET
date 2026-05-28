const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Role, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

exports.register = async (data) => {
  // Verificar si ya existe un usuario con ese correo
  const existingUser = await Usuario.findOne({ where: { correo: data.correo } });
  if (existingUser) {
    throw new AppError('El correo ya está registrado', 400);
  }

  // Hashear contraseña
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // Crear usuario
  const nuevoUsuario = await Usuario.create({
    correo: data.correo,
    password_hash: passwordHash,
    id_rol: data.id_rol,
    id_trabajador: data.id_trabajador,
    estado: true
  });

  // Generar token
  const token = signToken(nuevoUsuario.id_usuario);

  // Limpiar contraseña para no retornarla
  const userResponse = nuevoUsuario.toJSON();
  delete userResponse.password_hash;

  return { token, usuario: userResponse };
};

exports.login = async (correo, password) => {
  if (!correo || !password) {
    throw new AppError('Por favor proporcione correo y contraseña', 400);
  }

  // Buscar usuario incluyendo su Rol y Trabajador
  const usuario = await Usuario.findOne({
    where: { correo },
    include: [
      { model: Role },
      { model: Trabajador }
    ]
  });

  if (!usuario) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  if (!usuario.estado) {
    throw new AppError('Esta cuenta se encuentra inactiva', 403);
  }

  // Verificar contraseña
  const isMatch = await bcrypt.compare(password, usuario.password_hash);
  if (!isMatch) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  // Generar token
  const token = signToken(usuario.id_usuario);

  // Limpiar contraseña
  const userResponse = usuario.toJSON();
  delete userResponse.password_hash;

  return { token, usuario: userResponse };
};
