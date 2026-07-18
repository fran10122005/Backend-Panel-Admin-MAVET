const axios = require('axios');

/**
 * Utilidad para enviar correos usando la API REST de Email.js
 *
 * TODO para el compañero:
 * 1. Reemplazar los valores de SERVICE_ID, TEMPLATE_ID y PUBLIC_KEY con los de tu cuenta de Email.js.
 * 2. Asegurarte de que la plantilla en Email.js espere las variables que pasamos en template_params.
 */
const sendEmailJSEventCompleted = async (reservaData) => {
  const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'TU_SERVICE_ID_AQUI';
  const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'TU_TEMPLATE_ID_AQUI';
  const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'TU_PUBLIC_KEY_AQUI';

  if (!reservaData.correo_electronico) {
    console.log(
      `[EmailJS] No hay correo registrado para la reserva ${reservaData.codigo_reserva}, no se enviará notificación.`
    );
    return;
  }

  const data = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: reservaData.correo_electronico,
      codigo_reserva: reservaData.codigo_reserva,
      motivo: reservaData.motivo || reservaData.motivo_uso,
      fecha_uso: reservaData.fecha_uso || reservaData.fecha_solicitada,
      // Puedes añadir más variables según tu plantilla de Email.js
    },
  };

  try {
    // La API REST oficial de Email.js
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(
      `[EmailJS] Correo enviado exitosamente para la reserva ${reservaData.codigo_reserva}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `[EmailJS] Error al enviar correo para la reserva ${reservaData.codigo_reserva}:`,
      error.response ? error.response.data : error.message
    );
  }
};

module.exports = {
  sendEmailJSEventCompleted,
};
