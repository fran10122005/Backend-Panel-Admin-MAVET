const { z } = require('zod');

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const toStr = (val) => (val === null || val === undefined ? undefined : String(val));

const baseTallerSchema = {
  nombre_curso: z
    .preprocess(toStr, z.string().min(1, 'El nombre del curso es requerido'))
    .optional()
    .nullable()
    .default(undefined),
  inventario_id: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
  id_instructor: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
  id_espacio: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
  sesiones: z
    .preprocess(toStr, z.string().regex(/^\d+$/, 'Las sesiones deben ser un número positivo'))
    .optional()
    .nullable()
    .default(undefined),
  fecha: z
    .preprocess(toStr, z.string())
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
    .optional()
    .nullable()
    .default(undefined),
  fecha_fin: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
  hora_inicio: z
    .preprocess(
      toStr,
      z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de inicio inválida')
    )
    .optional()
    .nullable()
    .default(undefined),
  hora_fin: z
    .preprocess(
      toStr,
      z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)(:[0-5]\d)?$/, 'Hora de fin inválida')
    )
    .optional()
    .nullable()
    .default(undefined),
  horas_totales: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
  cupo_minimo: z
    .preprocess(
      toStr,
      z.string().regex(/^[1-9]\d*$/, 'El cupo mínimo debe ser un número positivo mayor a 0')
    )
    .optional()
    .nullable()
    .default(undefined),
  cupo_maximo: z
    .preprocess(
      toStr,
      z.string().regex(/^[1-9]\d*$/, 'El cupo máximo debe ser un número positivo mayor a 0')
    )
    .optional()
    .nullable()
    .default(undefined),
  estado: z.preprocess(toStr, z.string()).optional().nullable().default(undefined),
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

const createTallerSchema = tallerRefinements(z.object(baseTallerSchema));

const updateTallerSchema = tallerRefinements(z.object(baseTallerSchema));

const planificarTallerSchema = tallerRefinements(
  z.object({
    inventarioId: z
      .union([z.string(), z.number()])
      .refine((val) => !!val, { message: 'ID de inventario es requerido' }),
    ...baseTallerSchema,
  })
);

module.exports = {
  createTallerSchema,
  updateTallerSchema,
  planificarTallerSchema,
};
