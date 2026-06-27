const { z } = require('zod');

const createCargoTrabajadorSchema = z.object({
  nombre_cargo: z.string().min(1, 'El nombre del cargo es obligatorio'),
  descripcion: z.string().optional().or(z.literal('')),
});

const updateCargoTrabajadorSchema = createCargoTrabajadorSchema.partial();

const cargoIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero'),
});

module.exports = {
  createCargoTrabajadorSchema,
  updateCargoTrabajadorSchema,
  cargoIdParamSchema,
};
