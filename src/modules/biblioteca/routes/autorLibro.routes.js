const express = require('express');
const router = express.Router();
const autorController = require('../controllers/autorLibro.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createAutorLibroSchema,
  updateAutorLibroSchema,
  autorLibroIdParamSchema,
} = require('../schemas/autorLibro.schema');

router.post('/', validateZod({ body: createAutorLibroSchema }), autorController.createAutor);
router.get('/', autorController.getAllAutores);
router.get('/:id', validateZod({ params: autorLibroIdParamSchema }), autorController.getAutorById);
router.put(
  '/:id',
  validateZod({ params: autorLibroIdParamSchema, body: updateAutorLibroSchema }),
  autorController.updateAutor
);
router.delete(
  '/:id',
  validateZod({ params: autorLibroIdParamSchema }),
  autorController.deleteAutor
);

module.exports = router;
