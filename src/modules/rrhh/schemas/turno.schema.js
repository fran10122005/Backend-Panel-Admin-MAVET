const { z } = require('zod');

const createTurnoSchema = z.object({
  nombre_turno: z.string().min(1, 'El nombre del turno es obligatorio'),
  dias_trabajo: z.string().optional(),
  hora_entrada: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora de entrada inválida (HH:MM)')
    .optional(),
  hora_salida: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora de salida inválida (HH:MM)')
    .optional(),
});

const updateTurnoSchema = createTurnoSchema.partial();

const turnoIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero'),
});

module.exports = {
  createTurnoSchema,
  updateTurnoSchema,
  turnoIdParamSchema,
};
