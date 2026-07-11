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
  fecha_fin: z.string().optional(),
  hora_inicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de inicio inválida')
    .optional(),
  hora_fin: z
    .string()
    .regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de fin inválida')
    .optional(),
  horas_totales: z.string().optional(),
  cupo_minimo: z
    .string()
    .regex(/^[1-9]\d*$/, 'El cupo mínimo debe ser un número positivo mayor a 0')
    .optional(),
  cupo_maximo: z
    .string()
    .regex(/^[1-9]\d*$/, 'El cupo máximo debe ser un número positivo mayor a 0')
    .optional(),
  estado: z.string().optional(),
};

const tallerRefinements = (schema) =>
  schema
    .refine(
      (data) => {
        if (!data.cupo_minimo || !data.cupo_maximo) return true;
        return Number(data.cupo_minimo) <= Number(data.cupo_maximo);
      },
      {
        message: 'El cupo mínimo debe ser menor o igual al cupo máximo',
        path: ['cupo_minimo'],
      }
    )
    .refine(
      (data) => {
        if (!data.fecha || !data.fecha_fin) return true;
        return data.fecha <= data.fecha_fin;
      },
      {
        message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
        path: ['fecha'],
      }
    )
    .refine(
      (data) => {
        if (!data.hora_inicio || !data.hora_fin) return true;
        const [hI, mI] = data.hora_inicio.split(':').map(Number);
        const [hF, mF] = data.hora_fin.split(':').map(Number);
        const diffMin = hF * 60 + mF - (hI * 60 + mI);
        return diffMin >= 20;
      },
      {
        message: 'La hora de fin debe ser al menos 20 minutos después de la hora de inicio',
        path: ['hora_fin'],
      }
    );

const createTallerSchema = z.object({
  body: tallerRefinements(z.object(baseTallerSchema)),
});

const updateTallerSchema = z.object({
  body: tallerRefinements(z.object(baseTallerSchema)),
});

const planificarTallerSchema = z.object({
  body: tallerRefinements(
    z.object({
      inventarioId: z
        .union([z.string(), z.number()])
        .refine((val) => !!val, { message: 'ID de inventario es requerido' }),
      ...baseTallerSchema,
    })
  ),
});

module.exports = {
  createTallerSchema,
  updateTallerSchema,
  planificarTallerSchema,
};
