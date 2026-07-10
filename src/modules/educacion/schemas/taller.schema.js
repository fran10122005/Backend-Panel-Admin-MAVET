const { z } = require('zod');

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const baseTallerSchema = {
  nombre_curso: z.string().min(1, 'El nombre del curso es requerido').optional(),
  inventario_id: z.string().optional(),
  id_instructor: z.string().optional(),
  id_espacio: z.string().optional(),
  sesiones: z.string().regex(/^\d+$/, 'Las sesiones deben ser un número positivo').optional(),
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
      { message: 'La fecha no puede ser en el pasado' }
    )
    .optional(),
  hora_inicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de inicio inválida')
    .optional(),
  hora_fin: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de fin inválida')
    .optional(),
  horas_totales: z.string().optional(),
  cupo_minimo: z.string().regex(/^\d+$/, 'El cupo mínimo debe ser un número positivo').optional(),
  cupo_maximo: z.string().regex(/^\d+$/, 'El cupo máximo debe ser un número positivo').optional(),
  estado: z.string().optional(),
};

const createTallerSchema = z.object({
  body: z.object(baseTallerSchema),
});

const updateTallerSchema = z.object({
  body: z.object(baseTallerSchema),
});

const planificarTallerSchema = z.object({
  body: z.object({
    inventarioId: z
      .union([z.string(), z.number()])
      .refine((val) => !!val, { message: 'ID de inventario es requerido' }),
    ...baseTallerSchema,
  }),
});

module.exports = {
  createTallerSchema,
  updateTallerSchema,
  planificarTallerSchema,
};
