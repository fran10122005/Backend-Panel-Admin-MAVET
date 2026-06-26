const { z } = require('zod');

const createConsultaSalaSchema = z.object({
  id_libro: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().positive('El ID del libro es obligatorio')
  ),
  id_persona: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().positive().nullable().optional()
  ),
  id_trabajador: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().positive().nullable().optional()
  ),
  estado: z.string().max(255).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const updateConsultaSalaSchema = createConsultaSalaSchema.partial();

const consultaSalaIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero positivo'),
});

module.exports = {
  createConsultaSalaSchema,
  updateConsultaSalaSchema,
  consultaSalaIdParamSchema,
};
