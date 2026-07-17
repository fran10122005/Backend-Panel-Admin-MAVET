const { z } = require('zod');

const createInventarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
});

const updateInventarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  descripcion: z.string().optional(),
});

const inventarioIdParamSchema = z.object({
  id: z.string().min(1, 'ID inválido'),
});

module.exports = {
  createInventarioSchema,
  updateInventarioSchema,
  inventarioIdParamSchema,
};
