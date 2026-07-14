const { z } = require('zod');

const registrarIngresoSchema = z
  .object({
    id_motivo: z.string().min(1, 'El motivo de la visita es requerido'),
    id_taller: z.string().optional(),
    id_solicitud: z.string().optional(),
    cantidad_acompanantes: z.number().min(0).optional(),
    cedula: z.string().optional(),
    nombres: z.string().min(1, 'El nombre es requerido').optional(),
    apellidos: z.string().min(1, 'El apellido es requerido').optional(),
    telefono: z.string().optional(),
    fecha_de_nac: z.string().optional(),
    id_representante_persona: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fecha_de_nac) {
        const fechaNac = new Date(data.fecha_de_nac);
        const hoy = new Date();
        const minDate = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
        const maxDate = new Date(hoy.getFullYear() - 3, hoy.getMonth(), hoy.getDate());
        return fechaNac >= minDate && fechaNac <= maxDate;
      }
      return true;
    },
    {
      message: 'La persona debe tener entre 3 y 120 años',
      path: ['fecha_de_nac'],
    }
  );

module.exports = {
  registrarIngresoSchema,
};
