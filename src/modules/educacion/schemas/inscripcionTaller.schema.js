const { z } = require('zod');

const inscribirAlumnoSchema = z.object({
  tallerId: z
    .union([z.string(), z.number()])
    .refine((val) => !!val, { message: 'El ID del taller es requerido' }),
  alumno: z
    .object({
      nombre: z.string().min(1, 'El nombre del alumno es requerido'),
      cedula: z.string().optional(),
      fecha_nacimiento: z.string().optional(),
      edad: z.union([z.string(), z.number()]).optional(),
    })
    .refine((data) => data.fecha_nacimiento || data.edad, {
      message: 'Debe proporcionar la fecha de nacimiento (o al menos la edad)',
      path: ['fecha_nacimiento'],
    })
    .refine(
      (data) => {
        // Si proporciona fecha de nacimiento, validar que esté entre 3 y 120 años
        if (data.fecha_nacimiento) {
          const fechaNac = new Date(data.fecha_nacimiento);
          const hoy = new Date();
          const minDate = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
          const maxDate = new Date(hoy.getFullYear() - 3, hoy.getMonth(), hoy.getDate());
          return fechaNac >= minDate && fechaNac <= maxDate;
        }

        // Si solo proporciona edad, validar que esté entre 3 y 120
        if (data.edad) {
          const edad = parseInt(data.edad, 10);
          return edad >= 3 && edad <= 120;
        }
        return false;
      },
      {
        message: 'El alumno debe tener entre 3 y 120 años',
        path: ['fecha_nacimiento'],
      }
    ),
  representante: z
    .object({
      nombre: z.string().optional(),
      cedula: z.string().optional(),
      telefono: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  inscribirAlumnoSchema,
};
