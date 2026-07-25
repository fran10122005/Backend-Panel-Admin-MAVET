const ConfiguracionWeb = require('../../config/models/ConfiguracionWeb.model');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const EmailjsService = require('../../../services/emailjs.service');

exports.enviarContacto = catchAsync(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || name.length < 2) {
    return next(new AppError('El nombre debe tener al menos 2 caracteres', 400));
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError('Correo electrónico inválido', 400));
  }
  if (!subject || subject.length < 4) {
    return next(new AppError('El asunto debe tener al menos 4 caracteres', 400));
  }
  if (!message || message.length < 10) {
    return next(new AppError('El mensaje debe tener al menos 10 caracteres', 400));
  }

  // Obtener el correo destino desde la base de datos (Clave: correo_contacto)
  let config = await ConfiguracionWeb.findOne({ where: { clave: 'correo_contacto' } });

  if (!config) {
    config = await ConfiguracionWeb.create({ clave: 'correo_contacto', valor: 'info@mavet.org' });
  }

  const correoDestino = config.valor;

  if (!correoDestino) {
    return next(new AppError('No hay correo de contacto configurado en el sistema', 500));
  }

  // Adaptar nombres de variables para EmailJS
  const contactoData = {
    to: correoDestino,
    from_name: name,
    from_email: email,
    message: `Asunto: ${subject}\n\nMensaje:\n${message}`,
  };

  // Enviar el correo usando EmailJS
  await EmailjsService.sendContactMessage(contactoData);

  res.status(200).json({ status: 'success', message: 'Mensaje enviado con éxito' });
});
