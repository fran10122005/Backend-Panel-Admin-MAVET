const AppError = require('../utils/AppError');

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors && err.errors[0] && err.errors[0].path ? err.errors[0].path : 'campo';
  const message = `El valor ingresado para '${field}' ya se encuentra registrado. Por favor, intente con uno diferente.`;
  return new AppError(message, 400);
};

const handleSequelizeValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Datos inválidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleZodError = (err) => {
  const errors = Array.isArray(err.errors)
    ? err.errors.map((e) => e.message)
    : [err.message || 'error de validación'];
  const message = `Error de validación: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleSequelizeForeignKeyConstraintError = (err) => {
  const table = err.parent && err.parent.table ? err.parent.table : 'otro registro';
  const message = `No se puede eliminar este registro porque está referenciado en la tabla "${table}". Elimine los registros relacionados primero.`;
  return new AppError(message, 409);
};

const notFound = (req, res, next) => {
  next(new AppError(`No se puede encontrar ${req.originalUrl} en este servidor!`, 404));
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  if (error.name === 'SequelizeUniqueConstraintError')
    error = handleSequelizeUniqueConstraintError(error);
  if (error.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
  if (error.name === 'ZodError') error = handleZodError(error);
  if (error.name === 'SequelizeForeignKeyConstraintError')
    error = handleSequelizeForeignKeyConstraintError(error);

  // Modo desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error [Dev]:', error.statusCode, error.message);
    if (error.statusCode === 400 && error.error) console.error('Details:', error.error);
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: err.stack,
    });
  }

  // Modo producción
  if (error.isOperational) {
    console.error('API Error [Prod]:', error.statusCode, error.message);
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // Errores de programación u otros errores desconocidos
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: err.message || 'Algo salió muy mal!',
    stack: err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
