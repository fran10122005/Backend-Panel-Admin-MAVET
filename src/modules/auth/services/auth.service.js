const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Usuario, Role, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.register = async (data) => {
  if (!data.correo) throw new AppError('El correo es obligatorio', 400);
  if (!data.password) throw new AppError('La contraseña es obligatoria', 400);
  if (!data.id_rol) throw new AppError('El rol del sistema es obligatorio', 400);

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
    estado: true,
  });

  // Si se indicó un trabajador, vincularlo actualizando su id_usuario
  if (data.id_trabajador) {
    await Trabajador.update(
      { id_usuario: nuevoUsuario.id_usuario },
      { where: { id_trabajador: data.id_trabajador } }
    );
  }

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
    include: [{ model: Role }, { model: Trabajador }],
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
    if (trabajador)
      nombreMostrar =
        `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim() || 'Usuario';
  }

  const emailService = require('../../../services/email.service');
  await emailService.sendEmail({
    to: usuario.correo,
    subject: 'Recuperación de Contraseña - Panel MAVET',
    templateName: 'recover-password',
    templatePath: require('path').join(__dirname, '../templates'),
    context: {
      nombre: nombreMostrar,
      resetUrl,
    },
  });

  return true;
};

exports.resetPassword = async (token, nuevaPassword) => {
  const usuario = await Usuario.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: { [Op.gt]: new Date() },
    },
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

exports.updateMe = async (id_usuario, data) => {
  const usuario = await Usuario.findByPk(id_usuario, {
    include: [{ model: Trabajador }],
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(data.password, salt);
  }

  if (data.correo) {
    usuario.correo = data.correo;
  }

  if (usuario.Trabajador) {
    const tData = {};
    if (data.nombres !== undefined) tData.nombres = data.nombres;
    if (data.apellidos !== undefined) tData.apellidos = data.apellidos;
    if (data.correo_personal !== undefined) tData.correo_personal = data.correo_personal;
    if (data.telefono !== undefined) tData.telefono = data.telefono;

    await usuario.Trabajador.update(tData);
  } else if (data.nombres || data.apellidos || data.telefono) {
    // Create a Trabajador record for this user (e.g. admin)
    const nuevoTrabajador = await Trabajador.create({
      cedula: 'ADM-' + usuario.id_usuario,
      nombres: data.nombres || 'Admin',
      apellidos: data.apellidos || '',
      correo_personal: data.correo_personal || data.correo || usuario.correo,
      telefono: data.telefono || '',
      id_cargo: 1,
      id_usuario: usuario.id_usuario,
    });
    usuario.id_trabajador = nuevoTrabajador.id_trabajador;
  }

  await usuario.save();

  return true;
};

exports.subirFotoPerfil = async (id_usuario, filePath) => {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const cloudinary = require('../../../config/cloudinary');
  const fs = require('fs');

  let url = filePath;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'mavet_uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    });
    url = result.secure_url;
  } catch (uploadError) {
    console.error('Error al subir a Cloudinary:', uploadError.message);
    throw new AppError('Error al procesar la imagen. Intente nuevamente.', 500);
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  usuario.foto_url = url;
  await usuario.save();

  const trabajador = await Trabajador.findOne({ where: { id_usuario } });
  if (trabajador) {
    await trabajador.update({ foto_url: url });
  }

  return url;
};

exports.updateUsuario = async (id_usuario, data) => {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(data.password, salt);
  }

  if (data.correo) usuario.correo = data.correo;
  if (data.id_rol !== undefined) usuario.id_rol = data.id_rol;
  if (data.estado !== undefined) usuario.estado = data.estado;

  await usuario.save();

  // Vincular/desvincular trabajador actualizando id_usuario en la tabla trabajadores
  if (data.id_trabajador !== undefined) {
    // Primero desvinculamos cualquier trabajador que ya estaba asociado a este usuario
    await Trabajador.update({ id_usuario: null }, { where: { id_usuario } });
    // Si se seleccionó un trabajador válido, lo vinculamos
    if (data.id_trabajador && data.id_trabajador !== 0) {
      await Trabajador.update({ id_usuario }, { where: { id_trabajador: data.id_trabajador } });
    }
  }

  return usuario;
};
