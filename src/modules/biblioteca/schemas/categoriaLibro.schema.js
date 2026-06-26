const { z } = require('zod');

const createCategoriaLibroSchema = z.object({
  nombre_categoria: z.string().min(1, 'El nombre de la categoría es obligatorio').max(255),
  ubicacion_estante: z.string().max(255).optional().nullable(),
});

const updateCategoriaLibroSchema = createCategoriaLibroSchema.partial();

const categoriaLibroIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero positivo'),
});

module.exports = {
  createCategoriaLibroSchema,
  updateCategoriaLibroSchema,
  categoriaLibroIdParamSchema,
};
