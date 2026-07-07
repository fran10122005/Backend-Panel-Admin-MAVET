const { z } = require('zod');

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/; // Simplified ISO-8601 validation

const registrarAsistenciaSchema = z
  .object({
    cedulaTrabajador: z.string().optional(),
    qr_uuid: z.string().min(1).optional(),
    tipoMovimiento: z.enum(['Entrada', 'Salida']),
    observaciones: z.string().optional(),
  })
  .refine((data) => data.cedulaTrabajador || data.qr_uuid, {
    message: 'Debe proveer cédula o QR UUID',
    path: ['cedulaTrabajador'],
  });

const createAsistenciaQRSchema = z.object({
  id_trabajador: z.number().int().min(1, 'El ID del trabajador es obligatorio'),
  fecha: z.string().regex(dateStringRegex, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  entrada_manana: z
    .string()
    .regex(dateTimeRegex, 'Formato de fecha/hora inválido')
    .optional()
    .nullable(),
  salida_manana: z
    .string()
    .regex(dateTimeRegex, 'Formato de fecha/hora inválido')
    .optional()
    .nullable(),
  entrada_tarde: z
    .string()
    .regex(dateTimeRegex, 'Formato de fecha/hora inválido')
    .optional()
    .nullable(),
  salida_tarde: z
    .string()
    .regex(dateTimeRegex, 'Formato de fecha/hora inválido')
    .optional()
    .nullable(),
  horas_cumplidas_dia: z.number().min(0).optional(),
  observaciones: z.string().optional(),
});

const updateAsistenciaQRSchema = createAsistenciaQRSchema.partial();

const asistenciaIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número entero'),
});

module.exports = {
  createAsistenciaQRSchema,
  updateAsistenciaQRSchema,
  asistenciaIdParamSchema,
  registrarAsistenciaSchema,
};
