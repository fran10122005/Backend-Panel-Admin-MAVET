const { z } = require('zod');

const createTrabajadorSchema = z.object({
  id_usuario: z.string().optional(),
  cedula: z.string().min(1, 'La cédula es obligatoria'),
  nombres: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'El apellido es obligatorio'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  correo_personal: z.string().min(1, 'El correo es obligatorio').email('Debe ser un correo válido'),
  id_cargo: z.string().min(1, 'El cargo es obligatorio'),
  horas_semanales: z.number().min(0, 'Las horas no pueden ser negativas'),
  estado: z.boolean().optional(),
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria')
    .refine((val) => {
      const parts = val.split('-');
      if (parts.length !== 3) return true;
      const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const mDiff = today.getMonth() - birthDate.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18 && age <= 80;
    }, 'El trabajador debe tener entre 18 y 80 años'),
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  fecha_ingreso: z.string().min(1, 'La fecha de ingreso es obligatoria'),
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
