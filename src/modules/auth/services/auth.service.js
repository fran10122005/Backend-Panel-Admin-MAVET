const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
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

exports.forgotPassword = async (correo) => {
  const usuario = await Usuario.findOne({ where: { correo } });

  // Por seguridad, no revelamos si el correo existe o no
  if (!usuario) return true;

  // Generar token aleatorio seguro
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  usuario.reset_password_token = resetToken;
  usuario.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  await usuario.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  // Obtener el nombre del trabajador asociado si existe
  let nombreMostrar = 'Usuario';
  if (usuario.id_trabajador) {
    const { Trabajador } = require('../../../models');
    const trabajador = await Trabajador.findByPk(usuario.id_trabajador);
    if (trabajador) nombreMostrar = trabajador.nombre || trabajador.nombre_completo || 'Usuario';
  }

  const emailService = require('../../../services/email.service');
  await emailService.sendEmail({
    to: usuario.correo,
    subject: 'Recuperación de Contraseña - Panel MAVET',
    templateName: 'recover-password',
    templatePath: require('path').join(__dirname, '../templates'),
    context: {
      nombre: nombreMostrar,
      resetUrl
    }
  });

  return true;
};

exports.resetPassword = async (token, nuevaPassword) => {
  const usuario = await Usuario.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: { [Op.gt]: new Date() }
    }
  });

  if (!usuario) {
    throw new AppError('El token de recuperación es inválido o ha expirado.', 400);
  }

  // Hashear la nueva contraseña
  const salt = await bcrypt.genSalt(10);
  usuario.password_hash = await bcrypt.hash(nuevaPassword, salt);

  // Limpiar el token para que no pueda usarse de nuevo
  usuario.reset_password_token = null;
  usuario.reset_password_expires = null;

  await usuario.save();
  return true;
};

