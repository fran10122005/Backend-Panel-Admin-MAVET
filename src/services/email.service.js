const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const transportConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

class EmailService {
  /**
   * Compila una plantilla Handlebars desde la carpeta de templates
   * @param {string} templateName - Nombre del archivo (sin .hbs)
   * @param {Object} context - Variables a inyectar en la plantilla
   * @param {string} [templatePath] - Carpeta donde buscar la plantilla (opcional)
   */
  compileTemplate(templateName, context, templatePath) {
    const basePath = templatePath || path.join(__dirname, '../modules/auth/templates');
    const filePath = path.join(basePath, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(filePath, 'utf8');

    const fullContext = {
      ...context,
      currentYear: new Date().getFullYear()
    };

    return handlebars.compile(templateSource)(fullContext);
  }

  /**
   * Envía un correo electrónico
   * @param {Object} options
   * @param {string} options.to - Destinatario
   * @param {string} options.subject - Asunto
   * @param {string} [options.templateName] - Nombre de la plantilla Handlebars
   * @param {Object} [options.context] - Variables para la plantilla
   * @param {string} [options.html] - HTML directo (alternativo a template)
   */
  async sendEmail({ to, subject, templateName, context, html, templatePath }) {
    try {
      const mailTransporter = await getTransporter();

      let finalHtml = html;
      if (templateName && context) {
        finalHtml = this.compileTemplate(templateName, context, templatePath);
      }

      const mailOptions = {
        from: `"Panel Administrativo MAVET" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: finalHtml,
      };

      const info = await mailTransporter.sendMail(mailOptions);
      console.log('✅ Correo enviado: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error.message);
      throw new Error('No se pudo enviar el correo electrónico. Intente más tarde.');
    }
  }
}

module.exports = new EmailService();
