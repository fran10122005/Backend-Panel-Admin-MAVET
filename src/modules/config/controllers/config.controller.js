const ConfiguracionWeb = require('../models/ConfiguracionWeb.model');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const DEFAULT_CONFIG = {
  correo_contacto: 'info@mavet.org',
  telefono_general: '+58 276 343 3102',
  telefono_visitas: '+58 416 477 7436',
  enlace_instagram: 'https://instagram.com/mavet',
  enlace_facebook: 'https://facebook.com/mavet',
  enlace_youtube: 'https://youtube.com/mavet',
};

// Obtener la configuración
const getConfiguracion = catchAsync(async (req, res, next) => {
  const configs = await ConfiguracionWeb.findAll();

  // Transformar array de {clave, valor} a objeto {clave: valor}
  let configObj = {};
  configs.forEach((c) => {
    configObj[c.clave] = c.valor;
  });

  // Asegurar que existan los valores por defecto si no están en BD
  for (const [key, val] of Object.entries(DEFAULT_CONFIG)) {
    if (configObj[key] === undefined) {
      configObj[key] = val;
      await ConfiguracionWeb.create({ clave: key, valor: val });
    }
  }

  res.status(200).json({
    status: 'success',
    data: configObj,
  });
});

// Actualizar la configuración
const updateConfiguracion = catchAsync(async (req, res, next) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    // Actualizar o crear cada clave-valor
    let config = await ConfiguracionWeb.findOne({ where: { clave: key } });
    if (config) {
      config.valor = value;
      await config.save();
    } else {
      await ConfiguracionWeb.create({ clave: key, valor: value });
    }
  }

  // Devolver toda la configuración actualizada
  const configs = await ConfiguracionWeb.findAll();
  let configObj = {};
  configs.forEach((c) => {
    configObj[c.clave] = c.valor;
  });

  res.status(200).json({
    status: 'success',
    message: 'Configuración actualizada exitosamente',
    data: configObj,
  });
});

module.exports = {
  getConfiguracion,
  updateConfiguracion,
};
