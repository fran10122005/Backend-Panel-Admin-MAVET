const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { Role, Usuario } = require('../models');

const verifyToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Token no proporcionado. Por favor inicie sesión.', 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    if (!decoded || !decoded.id) {
      return next(new AppError('Token inválido.', 401));
    }

    const usuarioId = String(decoded.id);

    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ model: Role }],
    });

    if (!usuario) {
      return next(new AppError('El usuario que pertenece a este token ya no existe.', 401));
    }

    req.user = usuario;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido. Inicie sesión nuevamente.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Su token ha expirado. Inicie sesión nuevamente.', 401));
    }
    next(error);
  }
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.Role?.nombre_rol || req.user?.role || '';

    if (!roles.includes(userRole)) {
      return next(new AppError('No tiene permisos para realizar esta acción.', 403));
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRoles,
};
