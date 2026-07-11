const { z } = require('zod');

const createConsultaSalaSchema = z.object({
  id_libro: z.string().min(1, 'El ID del libro es obligatorio'),
  id_persona: z.string().optional().nullable(),
  id_trabajador: z.string().optional().nullable(),
  estado: z.string().max(255).optional().nullable(),
  observaciones: z.string().optional().nullable(),
  cedula: z.string().optional().nullable(),
  nombre: z.string().optional().nullable(),
});

const updateConsultaSalaSchema = z.object({
  estado: z.string().max(255).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const consultaSalaIdParamSchema = z.object({
  id: z.string().min(1, 'El ID es obligatorio'),
});

const consultaFiltrosSchema = z.object({
  periodo: z.enum(['hoy', 'semana', 'mes', 'personalizado']).optional().nullable(),
  fecha_desde: z.string().optional().nullable(),
  fecha_hasta: z.string().optional().nullable(),
  id_libro: z.string().optional().nullable(),
  id_persona: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const estadisticasSchema = z.object({
  top: z.coerce.number().int().min(1).max(50).optional().default(10),
});

module.exports = {
  createConsultaSalaSchema,
  updateConsultaSalaSchema,
  consultaSalaIdParamSchema,
  consultaFiltrosSchema,
  estadisticasSchema,
};
