const EmailService = require('../../../services/email.service');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '../templates');

exports.enviarContacto = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Correo electrónico inválido' });
  }
  if (!subject || subject.length < 4) {
    return res.status(400).json({ error: 'El asunto debe tener al menos 4 caracteres' });
  }
  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres' });
  }

  await EmailService.sendEmail({
    to: process.env.SMTP_USER,
    subject: `[Contacto Web] ${subject}`,
    templateName: 'contact-notification',
    context: { name, email, subject, message },
    templatePath: TEMPLATE_DIR,
  });

  res.json({ message: 'Mensaje enviado con éxito' });
};
