const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaLibro.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createCategoriaLibroSchema,
  updateCategoriaLibroSchema,
  categoriaLibroIdParamSchema,
} = require('../schemas/categoriaLibro.schema');

router.post(
  '/',
  validateZod({ body: createCategoriaLibroSchema }),
  categoriaController.createCategoria
);
router.get('/', categoriaController.getAllCategorias);
router.get(
  '/:id',
  validateZod({ params: categoriaLibroIdParamSchema }),
  categoriaController.getCategoriaById
);
router.put(
  '/:id',
  validateZod({ params: categoriaLibroIdParamSchema, body: updateCategoriaLibroSchema }),
  categoriaController.updateCategoria
);
router.delete(
  '/:id',
  validateZod({ params: categoriaLibroIdParamSchema }),
  categoriaController.deleteCategoria
);

module.exports = router;
