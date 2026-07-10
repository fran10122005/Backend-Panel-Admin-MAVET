const { z } = require('zod');

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const baseSesionSchema = {
  id_taller: z.string().min(1, 'El ID del taller es requerido').optional(),
  fecha: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const parts = val.split('-');
        if (parts.length !== 3) return false;
        const dateToCheck = new Date(parts[0], parts[1] - 1, parts[2]);
        return dateToCheck >= getToday();
      },
      { message: 'La fecha de la sesión no puede ser en el pasado' }
    )
    .optional(),
  tema_impartido: z.string().optional(),
};

const createSesionSchema = z.object({
  body: z.object({
    fecha: z
      .string()
      .min(1, 'La fecha es requerida')
      .refine(
        (val) => {
          const parts = val.split('-');
          if (parts.length !== 3) return false;
          const dateToCheck = new Date(parts[0], parts[1] - 1, parts[2]);
          return dateToCheck >= getToday();
        },
        { message: 'La fecha de la sesión no puede ser en el pasado' }
      ),
    tema_impartido: z.string().min(1, 'El tema impartido es requerido'),
  }),
});

const updateSesionSchema = z.object({
  body: z.object(baseSesionSchema),
});

module.exports = {
  createSesionSchema,
  updateSesionSchema,
};
