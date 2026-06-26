const { z } = require('zod');

const createAutorLibroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(255),
  apellido: z.string().max(255).optional().nullable(),
});

const updateAutorLibroSchema = createAutorLibroSchema.partial();

const autorLibroIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero positivo'),
});

module.exports = {
  createAutorLibroSchema,
  updateAutorLibroSchema,
  autorLibroIdParamSchema,
};
