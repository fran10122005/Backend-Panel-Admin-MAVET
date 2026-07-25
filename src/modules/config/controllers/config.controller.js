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

  // Secciones del Home
  home_hero_titulo: 'El epicentro del arte y la cultura del Táchira',
  home_hero_subtitulo: 'MUSEO DE ARTES VISUALES Y DEL ESPACIO',

  home_mision:
    'Transformar positivamente a la población mediante la comprensión, el reconocimiento y la conservación profunda del patrimonio construido, integrándolo como parte esencial de la memoria viva del casco histórico de San Cristóbal.',

  home_vision:
    'Desarrollar y potenciar las capacidades creativas y culturales de la comunidad, promoviendo una mayor comprensión y apreciación de las diversas expresiones artísticas: pintura, dibujo, teatro, música, danza, medios audiovisuales, artesanía y otras formas de arte.',

  home_objetivo_general:
    'Gestar una formación integral en la investigación como medio de conservación para la protección del patrimonio cultural mueble e inmueble, desarrollando estrategias innovadoras en todos los aspectos de las artes para la transformación social, cultural y estética de la población en el estado Táchira.',

  home_objetivos_especificos: JSON.stringify([
    'Difundir el acervo cultural regional y nacional mediante exposiciones, programas educativos y talleres de formación artística continua que fortalezcan la identidad y la memoria histórica del Táchira.',
    'Impulsar el crecimiento creativo y el desarrollo intelectual, emocional y motriz de niños, jóvenes y adultos a través de propuestas de transformación artística y cultural.',
    'Brindar atención integral a cultores, visitantes y colectivos mediante visitas guiadas, conversatorios, atención bibliotecaria y la exaltación de las tradiciones regionales y nacionales.',
  ]),

  home_historia_intro:
    '"Bienvenidos al MAVET, una institución emblemática de la Gobernación del Estado Táchira dedicada a la difusión, preservación y fortalecimiento de nuestra identidad cultural y memoria histórica."',

  home_historia_titulo: 'Un siglo dedicado a la memoria visual de una región.',

  home_historia_cuerpo_1:
    'Fundado en una casona patrimonial del centro de San Cristóbal, el Museo de Artes Visuales y Espacios del Táchira nació del impulso colectivo de artistas, docentes y mecenas que soñaron con una institución a la altura de la sensibilidad andina: rigurosa, accesible y profundamente arraigada.',

  home_historia_cuerpo_2:
    'Hoy, sus salas reúnen pintura, escultura, fotografía y obra gráfica de los siglos XIX al XXI, en diálogo permanente con programas educativos, investigación y residencias artísticas.',

  // Galería
  gallery_hero_titulo: 'Nuestra Colección',
  gallery_hero_subtitulo: 'Galería',

  // Servicios
  servicios_hero_titulo: 'Un museo vivo, abierto a la comunidad.',
  servicios_tarjeta_1_titulo: 'Clases y Talleres de Arte',
  servicios_tarjeta_1_desc:
    'Programas presenciales de pintura, dibujo, grabado y escultura impartidos por artistas y docentes en residencia.',
  servicios_tarjeta_2_titulo: 'Eventos y Auditorio',
  servicios_tarjeta_2_desc:
    'Auditorio para conciertos, conferencias y proyecciones. Espacios disponibles para alquiler institucional y privado.',
  servicios_tarjeta_3_titulo: 'Biblioteca e Investigación',
  servicios_tarjeta_3_desc:
    'Fondo bibliográfico especializado en arte, historia y patrimonio del Táchira, abierto a investigadores y estudiantes.',

  // Contacto
  contacto_hero_titulo: 'Te esperamos en el corazón de San Cristóbal.',
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
