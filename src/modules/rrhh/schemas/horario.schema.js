const { z } = require('zod');

const updateHorasSchema = z.object({
  horas_nuevas: z.number().min(0, 'Las nuevas horas son obligatorias'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
});

const historialIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero'),
});

module.exports = {
  updateHorasSchema,
  historialIdParamSchema,
};
