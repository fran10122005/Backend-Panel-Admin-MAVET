const { z } = require('zod');

// Calculamos las fechas límites
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getSixMonthsFromNow = () => {
  const future = new Date();
  future.setMonth(future.getMonth() + 6);
  future.setHours(23, 59, 59, 999);
  return future;
};

const createSolicitudSchema = z
  .object({
    codigo_reserva: z.string().optional(),
    id_espacio: z.string().min(1, 'El espacio es requerido'),
    id_persona: z.string().optional(),
    cedula: z.string().optional(),
    institucion: z.string().optional(),
    fecha_uso: z.string().optional(),
    fecha_solicitada: z.string().optional(),
    hora_inicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de inicio inválida'),
    hora_fin: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de fin inválida'),
    motivo: z.string().optional(),
    motivo_uso: z.string().optional(),
    estado: z.string().optional(),
    estado_solicitud: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validar que se envíe id_persona o cedula
      return data.id_persona || data.cedula;
    },
    {
      message: 'Se requiere id_persona o cédula para registrar la solicitud',
      path: ['id_persona'],
    }
  )
  .refine(
    (data) => {
      // Validar que la fecha de uso sea válida
      const fecha = data.fecha_uso || data.fecha_solicitada;
      if (!fecha) return false;

      // Asumimos formato YYYY-MM-DD para inicializar Date sin problemas de timezone
      const parts = fecha.split('-');
      if (parts.length !== 3) return false;

      const dateToCheck = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = getToday();
      const maxDate = getSixMonthsFromNow();

      return dateToCheck >= today && dateToCheck <= maxDate;
    },
    {
      message: 'La fecha de reserva debe ser hoy o en el futuro (máximo 6 meses)',
      path: ['fecha_uso'],
    }
  );

const updateSolicitudSchema = z
  .object({
    codigo_reserva: z.string().optional(),
    id_espacio: z.string().optional(),
    id_persona: z.string().optional(),
    cedula: z.string().optional(),
    institucion: z.string().optional(),
    fecha_uso: z.string().optional(),
    fecha_solicitada: z.string().optional(),
    hora_inicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de inicio inválida')
      .optional(),
    hora_fin: z
      .string()
      .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de fin inválida')
      .optional(),
    motivo: z.string().optional(),
    motivo_uso: z.string().optional(),
    estado: z.string().optional(),
    estado_solicitud: z.string().optional(),
  })
  .refine(
    (data) => {
      const fecha = data.fecha_uso || data.fecha_solicitada;
      if (!fecha) return true; // Si no se actualiza la fecha, es válido

      const parts = fecha.split('-');
      if (parts.length !== 3) return false;

      const dateToCheck = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = getToday();
      const maxDate = getSixMonthsFromNow();

      return dateToCheck >= today && dateToCheck <= maxDate;
    },
    {
      message: 'La fecha de reserva debe ser hoy o en el futuro (máximo 6 meses)',
      path: ['fecha_uso'],
    }
  );

module.exports = {
  createSolicitudSchema,
  updateSolicitudSchema,
};
