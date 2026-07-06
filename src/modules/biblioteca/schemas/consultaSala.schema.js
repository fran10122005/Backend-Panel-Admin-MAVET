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

module.exports = {
  createConsultaSalaSchema,
  updateConsultaSalaSchema,
  consultaSalaIdParamSchema,
};
