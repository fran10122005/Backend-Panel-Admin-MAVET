const AppError = require('../utils/AppError');

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

class EmailjsService {
  buildTempPasswordHtml({ nombre, tempPassword }) {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contrasena Temporal - MAVET</title>
</head>
<body style="margin:0;padding:0;background-color:#faf0f0;font-family:'Playfair Display',Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:16px;box-shadow:0 4px 24px rgba(128,0,0,0.10);">

          <!-- ENCABEZADO -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#800000 0%,#600000 100%);padding:44px 32px 36px;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:68px;height:68px;line-height:68px;text-align:center;margin-bottom:18px;">
                <span style="font-size:30px;">&#128274;</span>
              </div>
              <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;letter-spacing:0.5px;">Contrasena Temporal</h1>
              <p style="color:#ebc2c2;font-size:13px;margin:0;letter-spacing:2px;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">Museo de Artes Visuales y del Espacio</p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px;">
              <p style="color:#333333;font-size:16px;line-height:1.7;margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;">Hola, <strong style="color:#800000;">${nombre}</strong></p>
              <p style="color:#555555;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:'Segoe UI',Arial,sans-serif;">
                Has solicitado la recuperacion de tu contrasena en el Panel Administrativo MAVET.
                Utiliza la siguiente contrasena temporal para acceder al sistema:
              </p>

              <!-- CONTRASENA TEMPORAL -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#faf0f0;border-radius:12px;border:2px dashed #800000;padding:24px 20px;">
                    <p style="color:#800000;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:3px;font-family:'Segoe UI',Arial,sans-serif;font-weight:700;">Tu contrasena temporal es</p>
                    <p style="color:#800000;font-size:30px;font-weight:700;margin:0;letter-spacing:5px;font-family:'Courier New',monospace;background:#ffffff;display:inline-block;padding:10px 24px;border-radius:8px;border:1px solid #ebc2c2;">${tempPassword}</p>
                  </td>
                </tr>
              </table>

              <!-- INSTRUCCIONES -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#faf0f0;border-radius:12px;border-left:4px solid #800000;padding:20px 24px;">
                    <p style="color:#800000;font-size:14px;font-weight:700;margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;">Instrucciones</p>
                    <p style="color:#555555;font-size:14px;margin:0;line-height:1.8;font-family:'Segoe UI',Arial,sans-serif;">
                      1. Ingresa al sistema con esta contrasena temporal<br/>
                      2. Dirigete a tu <strong style="color:#800000;">Perfil</strong><br/>
                      3. Selecciona la pestana <strong style="color:#800000;">Seguridad</strong><br/>
                      4. Establece una contrasena nueva de tu preferencia
                    </p>
                  </td>
                </tr>
              </table>

              <!-- AVISO SEGURIDAD -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fff9f0;border-radius:12px;border-left:4px solid #d4a843;padding:16px 20px;">
                    <p style="color:#8a6d2a;font-size:13px;font-weight:700;margin:0 0 4px;font-family:'Segoe UI',Arial,sans-serif;">&#9888; Aviso de seguridad</p>
                    <p style="color:#6b5a30;font-size:13px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">Si no solicitaste esta contrasena temporal, ignora este correo. Tu cuenta permanece segura.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PIE DE PAGINA -->
          <tr>
            <td align="center" style="background:#f5e1e1;padding:24px 32px;">
              <p style="color:#800000;font-size:11px;margin:0 0 8px;font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">
                Este correo fue enviado automaticamente por el sistema. Por favor, no respondas a este mensaje.
              </p>
              <p style="color:#a33d3d;font-size:11px;margin:0;font-family:'Segoe UI',Arial,sans-serif;">
                &copy; ${year} Museo de Artes Visuales y del Espacio (MAVET). Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendTempPassword({ to, nombre, tempPassword }) {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    console.log('📧 EmailJS configuración:', {
      serviceId: serviceId || 'NO CONFIGURADO',
      templateId: templateId || 'NO CONFIGURADO',
      publicKey: publicKey ? '***' + publicKey.slice(-4) : 'NO CONFIGURADO',
    });

    if (!serviceId || !templateId || !publicKey) {
      throw new AppError('EmailJS no está configurado correctamente. Verifique las variables de entorno.', 500);
    }

    const htmlBody = this.buildTempPasswordHtml({ nombre, tempPassword });

    const requestBody = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: to,
        body: htmlBody,
      },
    };

    console.log('📧 Enviando correo a:', to);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(EMAILJS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ EmailJS error HTTP', response.status, responseText);
      throw new AppError(
        `Error al enviar el correo electrónico (EmailJS ${response.status}). Intente más tarde.`,
        500
      );
    }

    console.log('✅ EmailJS respuesta:', responseText);
    return responseText;
  }
}

module.exports = new EmailjsService();
