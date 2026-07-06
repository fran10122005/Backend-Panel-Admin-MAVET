const { z } = require('zod');

const createTrabajadorSchema = z.object({
  id_usuario: z.string().optional(),
  cedula: z.string().min(1, 'La cédula es obligatoria'),
  nombres: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'El apellido es obligatorio'),
  telefono: z.string().optional(),
  correo_personal: z.string().email('Debe ser un correo válido').optional().or(z.literal('')),
  id_cargo: z.string().min(1, 'El cargo es obligatorio'),
  horas_semanales: z.number().min(0, 'Las horas no pueden ser negativas').optional(),
  estado: z.boolean().optional(),
  foto_url: z.string().optional(),
});

const updateTrabajadorSchema = createTrabajadorSchema.partial();

const trabajadorIdParamSchema = z.object({
  id: z.string().min(1, 'El ID es obligatorio'),
});

module.exports = {
  createTrabajadorSchema,
  updateTrabajadorSchema,
  trabajadorIdParamSchema,
};
