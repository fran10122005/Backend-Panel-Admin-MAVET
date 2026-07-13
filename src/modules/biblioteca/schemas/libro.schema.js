const { z } = require('zod');

const createLibroSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio').max(255),
  unidad: z.string().max(255).optional().nullable(),
  cuota: z.string().max(255).optional().nullable(),
  estante: z.string().max(255).optional().nullable(),
  ano_libro: z.preprocess(
    (val) => (val ? Number(val) : null),
    z
      .number()
      .min(1000, 'Año inválido')
      .max(new Date().getFullYear(), 'El año del libro no puede ser futuro')
      .nullable()
      .optional()
  ),
  id_categoria: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional()
    .nullable(),
  cantidad_total: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : 1),
    z.number().int().min(1, 'La cantidad total debe ser al menos 1')
  ),
  estado: z.string().max(255).optional().nullable(),
  fecha_ingreso: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val <= new Date().toISOString().split('T')[0], {
      message: 'La fecha de ingreso no puede ser posterior al día de hoy',
    }),
  autor: z.string().max(255).optional().nullable(),
  id_autor: z.string().optional().nullable(),
  cantidad_disponible: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : null),
    z.number().int().nullable().optional()
  ),
});

const updateLibroSchema = createLibroSchema.partial();

const libroIdParamSchema = z.object({
  id: z.string().min(1, 'El ID es obligatorio'),
});

module.exports = {
  createLibroSchema,
  updateLibroSchema,
  libroIdParamSchema,
};
