const { z } = require('zod');

const createLibroSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio').max(255),
  unidad: z.string().max(255).optional().nullable(),
  cuota: z.string().max(255).optional().nullable(),
  estante: z.string().max(255).optional().nullable(),
  ano_libro: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().min(1000, 'Año inválido').max(2099, 'Año inválido').nullable().optional()
  ),
  id_categoria: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().nullable().optional()
  ),
  cantidad_total: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number().int().min(1, 'La cantidad total debe ser al menos 1')
  ),
  estado: z.string().max(255).optional().nullable(),
  fecha_ingreso: z.string().optional().nullable(),
  autor: z.string().max(255).optional().nullable(),
  id_autor: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().positive().nullable().optional()
  ),
  cantidad_disponible: z.preprocess(
    (val) => (val ? Number(val) : null),
    z.number().int().nullable().optional()
  ),
});

const updateLibroSchema = createLibroSchema.partial();

const libroIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero positivo'),
});

module.exports = {
  createLibroSchema,
  updateLibroSchema,
  libroIdParamSchema,
};
