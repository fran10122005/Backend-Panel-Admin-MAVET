const AppError = require('../utils/AppError');

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

class EmailjsService {
  buildTempPasswordHtml({ nombre, tempPassword }) {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contraseña Temporal - MAVET</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ENCABEZADO -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#a78bfa);border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;margin-bottom:16px;">
                <span style="font-size:28px;">🔑</span>
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">Contraseña Temporal</h1>
              <p style="color:#a78bfa;font-size:14px;margin:0;letter-spacing:1px;text-transform:uppercase;">Museo de Artes Visuales y del Espacio</p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="background:#1a1a2e;padding:40px 32px;">
              <p style="color:#c4c4d4;font-size:16px;line-height:1.6;margin:0 0 16px;">Hola, <strong style="color:#ffffff;">${nombre}</strong></p>
              <p style="color:#c4c4d4;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Has solicitado la recuperación de tu contraseña en el Panel Administrativo MAVET.
                Utiliza la siguiente contraseña temporal para acceder al sistema:
              </p>

              <!-- CONTRASEÑA TEMPORAL -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background:#0f0f1a;border-radius:12px;border:2px dashed #6c63ff;padding:20px;">
                    <p style="color:#8888aa;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Tu contraseña temporal es</p>
                    <p style="color:#ffffff;font-size:28px;font-weight:700;margin:0;letter-spacing:4px;font-family:'Courier New',monospace;">${tempPassword}</p>
                  </td>
                </tr>
              </table>

              <!-- INSTRUCCIONES -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;border-radius:12px;border-left:4px solid #6c63ff;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#a78bfa;font-size:14px;font-weight:700;margin:0 0 8px;">📋 Instrucciones</p>
                    <p style="color:#c4c4d4;font-size:14px;margin:0;line-height:1.6;">
                      1. Ingresa al sistema con esta contraseña temporal<br/>
                      2. Dirígete a tu <strong style="color:#ffffff;">Perfil</strong><br/>
                      3. Selecciona la pestaña <strong style="color:#ffffff;">Seguridad</strong><br/>
                      4. Establece una contraseña nueva de tu preferencia
                    </p>
                  </td>
                </tr>
              </table>

              <!-- AVISO SEGURIDAD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;border-radius:12px;border-left:4px solid #f59e0b;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#f59e0b;font-size:14px;font-weight:700;margin:0 0 4px;">⚠️ Aviso de seguridad</p>
                    <p style="color:#c4c4d4;font-size:14px;margin:0;">Si no solicitaste esta contraseña temporal, ignora este correo. Tu cuenta permanece segura.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PIE DE PÁGINA -->
          <tr>
            <td align="center" style="background:#12122a;border-radius:0 0 16px 16px;padding:24px 32px;">
              <p style="color:#555577;font-size:12px;margin:0 0 8px;">
                Este correo fue enviado automáticamente por el sistema. Por favor, no respondas a este mensaje.
              </p>
              <p style="color:#555577;font-size:12px;margin:0;">
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
