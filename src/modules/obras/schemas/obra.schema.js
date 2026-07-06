const { z } = require('zod');

// Schema para la creación de Obras (body)
// Se omiten imagen_url porque lo maneja Multer en el controlador por ahora,
// aunque idealmente la metadata debería venir validada.
const createObraSchema = z.object({
  id_entrega: z.string().optional(),
  codigo_inventario: z.string().max(255).optional(),
  titulo: z.string().min(1, 'El título es requerido').max(255),
  id_artista: z.string().optional(),
  anio: z.coerce.number().int().optional(),
  medidas: z.string().max(255).optional(),
  peso: z.coerce.number().optional(),
  id_tecnica: z.string().optional(),
  tipo_ingreso: z.string().max(255).optional(),
  id_estado_actual: z.string().optional(),
  ubicacion_actual: z.string().max(255).optional(),
  piezas: z.coerce.number().int().min(1).optional(),
  modalidad: z.string().max(255).optional(),
  id_categoria_obra: z.string().optional(),
  descripcion: z.string().optional(),
});

// Schema para actualización (body) - todos los campos son opcionales
const updateObraSchema = createObraSchema.partial();

// Schema para paginación y filtros (query)
const getObrasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

// Schema para validación de IDs en la URL (params)
const obraIdParamSchema = z.object({
  id: z.string(),
});

module.exports = {
  createObraSchema,
  updateObraSchema,
  getObrasQuerySchema,
  obraIdParamSchema,
};
