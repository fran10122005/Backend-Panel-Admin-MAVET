const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Usuario, Role, Trabajador } = require('../../../models');
const AppError = require('../../../utils/AppError');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 30;
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const generateRefreshToken = (id) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);
  return { token, expiresAt };
};

exports.register = async (data) => {
  if (!data.correo) throw new AppError('El correo es obligatorio', 400);
  if (!data.password) throw new AppError('La contraseña es obligatoria', 400);
  if (!data.id_rol) throw new AppError('El rol del sistema es obligatorio', 400);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const usuarioExistente = await Usuario.findOne({
    where: { correo: data.correo },
    paranoid: false,
  });

  let nuevoUsuario;

  if (usuarioExistente) {
    if (usuarioExistente.deleted_at === null) {
      throw new AppError('El correo ya está registrado', 400);
    }

    usuarioExistente.set({
      password_hash: passwordHash,
      id_rol: data.id_rol,
      estado: true,
      deleted_at: null,
    });
    await usuarioExistente.save({ paranoid: false });
    nuevoUsuario = usuarioExistente;
  } else {
    nuevoUsuario = await Usuario.create({
      correo: data.correo,
      password_hash: passwordHash,
      id_rol: data.id_rol,
      estado: true,
    });
  }

  if (data.id_trabajador) {
    await Trabajador.update(
      { id_usuario: nuevoUsuario.id_usuario },
      { where: { id_trabajador: data.id_trabajador } }
    );
  }

  const token = signAccessToken(nuevoUsuario.id_usuario);

  const { token: refreshToken, expiresAt } = generateRefreshToken(nuevoUsuario.id_usuario);
  nuevoUsuario.refresh_token = refreshToken;
  nuevoUsuario.refresh_token_expires = expiresAt;
  await nuevoUsuario.save();

  const userResponse = nuevoUsuario.toJSON();
  delete userResponse.password_hash;
  delete userResponse.refresh_token;
  delete userResponse.refresh_token_expires;

  return { token, refreshToken, usuario: userResponse };
};

exports.login = async (correo, password, req = null) => {
  if (!correo || !password) {
    throw new AppError('Por favor proporcione correo y contraseña', 400);
  }

  const usuario = await Usuario.findOne({
    where: { correo },
    include: [{ model: Role }, { model: Trabajador }],
  });

  if (!usuario) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  if (!usuario.estado) {
    throw new AppError(
      'Esta cuenta se encuentra suspendida. Para mas información comunicate con el coordinador(a) o administrador(a)',
      403
    );
  }

  const ahora = new Date();
  if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > ahora) {
    const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - ahora) / 60000);
    throw new AppError(
      `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente de nuevo en ${minutosRestantes} minuto(s).`,
      429
    );
  }

  const isMatch = await bcrypt.compare(password, usuario.password_hash);
  if (!isMatch) {
    usuario.intentos_fallidos = (usuario.intentos_fallidos || 0) + 1;
    if (usuario.intentos_fallidos >= MAX_INTENTOS) {
      usuario.bloqueado_hasta = new Date(ahora.getTime() + BLOQUEO_MINUTOS * 60000);
      await usuario.save();
      const auditoria = require('./auditoria.service');
      await auditoria.registrar({
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        tipo: 'error',
        detalle: `Cuenta bloqueada tras ${MAX_INTENTOS} intentos fallidos`,
        req,
      });
      throw new AppError(
        `Cuenta bloqueada temporalmente por ${BLOQUEO_MINUTOS} minutos debido a múltiples intentos fallidos.`,
        429
      );
    }
    await usuario.save();
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  usuario.intentos_fallidos = 0;
  usuario.bloqueado_hasta = null;

  const token = signAccessToken(usuario.id_usuario);
  const { token: refreshToken, expiresAt } = generateRefreshToken(usuario.id_usuario);
  usuario.refresh_token = refreshToken;
  usuario.refresh_token_expires = expiresAt;
  await usuario.save();

  const userResponse = usuario.toJSON();
  delete userResponse.password_hash;
  delete userResponse.refresh_token;
  delete userResponse.refresh_token_expires;

  const auditoria = require('./auditoria.service');
  await auditoria.registrar({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    tipo: 'login',
    detalle: `Inicio de sesión exitoso`,
    req,
  });

  return { token, refreshToken, usuario: userResponse };
};

exports.forgotPassword = async (correo) => {
  const usuario = await Usuario.findOne({
    where: { correo },
    include: [{ model: Trabajador }],
  });

  // Por seguridad, no revelamos si el correo existe o no
  if (!usuario) return true;

  // Generar contraseña temporal aleatoria (10 caracteres alfanuméricos)
  const tempPassword = crypto.randomBytes(5).toString('hex');

  // Hashear la contraseña temporal y guardarla
  const salt = await bcrypt.genSalt(10);
  usuario.password_hash = await bcrypt.hash(tempPassword, salt);
  await usuario.save();

  // Obtener el nombre del trabajador asociado si existe
  let nombreMostrar = 'Usuario';
  if (usuario.Trabajador) {
    nombreMostrar =
      `${usuario.Trabajador.nombres || ''} ${usuario.Trabajador.apellidos || ''}`.trim() ||
      'Usuario';
  }

  const emailjsService = require('../../../services/emailjs.service');
  await emailjsService.sendTempPassword({
    to: usuario.correo,
    nombre: nombreMostrar,
    tempPassword,
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

  return url;
};

exports.eliminarFotoPerfil = async (id_usuario) => {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  usuario.foto_url = null;
  await usuario.save();

  return true;
};

exports.updateUsuario = async (id_usuario, data) => {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  if (data.correo && data.correo !== usuario.correo) {
    const existente = await Usuario.findOne({
      where: { correo: data.correo },
      paranoid: false,
    });
    if (existente) {
      if (existente.deleted_at === null) {
        throw new AppError('El correo ya está registrado por otro usuario', 400);
      }
      await Usuario.update(
        { correo: `deleted_${Date.now()}_${existente.correo}` },
        { where: { id_usuario: existente.id_usuario }, paranoid: false }
      );
    }
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(data.password, salt);
  }

  // Validar si se está intentando inactivar o cambiar el rol de un administrador
  if (
    data.estado === false ||
    data.estado === 'false' ||
    (data.id_rol && data.id_rol !== usuario.id_rol)
  ) {
    const adminRol = await Role.findOne({ where: { nombre_rol: 'Administrador' } });
    if (adminRol && usuario.id_rol === adminRol.id_rol) {
      const adminCount = await Usuario.count({ where: { id_rol: adminRol.id_rol, estado: true } });
      if (adminCount <= 1) {
        throw new AppError(
          'No puedes suspender o cambiar el rol del único administrador del sistema',
          400
        );
      }
    }
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

exports.deleteUsuario = async (id_usuario, solicitante_id) => {
  if (id_usuario === solicitante_id) {
    throw new AppError('No puedes eliminar tu propio usuario', 400);
  }

  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const adminRol = await Role.findOne({ where: { nombre_rol: 'Administrador' } });
  if (adminRol && usuario.id_rol === adminRol.id_rol) {
    const adminCount = await Usuario.count({ where: { id_rol: adminRol.id_rol, estado: true } });
    if (adminCount <= 1) {
      throw new AppError('No puedes eliminar al único administrador del sistema', 400);
    }
  }

  await Trabajador.update({ id_usuario: null }, { where: { id_usuario } });

  await usuario.destroy();
  return true;
};

exports.changePassword = async (id_usuario, passwordActual, passwordNuevo) => {
  const usuario = await Usuario.findByPk(id_usuario);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const isMatch = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!isMatch) {
    throw new AppError('La contraseña actual no es correcta', 401);
  }

  const salt = await bcrypt.genSalt(10);
  usuario.password_hash = await bcrypt.hash(passwordNuevo, salt);

  usuario.refresh_token = null;
  usuario.refresh_token_expires = null;
  await usuario.save();

  return true;
};

exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token no proporcionado', 401);
  }

  const usuario = await Usuario.findOne({
    where: {
      refresh_token: refreshToken,
      refresh_token_expires: { [Op.gt]: new Date() },
    },
    include: [{ model: Role }, { model: Trabajador }],
  });

  if (!usuario) {
    throw new AppError('Refresh token inválido o expirado. Inicie sesión nuevamente.', 401);
  }

  const nuevoAccessToken = signAccessToken(usuario.id_usuario);
  const { token: nuevoRefreshToken, expiresAt } = generateRefreshToken(usuario.id_usuario);
  usuario.refresh_token = nuevoRefreshToken;
  usuario.refresh_token_expires = expiresAt;
  await usuario.save();

  return { token: nuevoAccessToken, refreshToken: nuevoRefreshToken, usuario };
};

exports.clearRefreshToken = async (id_usuario) => {
  await Usuario.update(
    { refresh_token: null, refresh_token_expires: null },
    { where: { id_usuario } }
  );
};
