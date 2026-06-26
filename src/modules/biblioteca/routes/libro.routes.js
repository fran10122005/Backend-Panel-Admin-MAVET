const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libro.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createLibroSchema,
  updateLibroSchema,
  libroIdParamSchema,
} = require('../schemas/libro.schema');

router.post('/', validateZod({ body: createLibroSchema }), libroController.createLibro);
router.get('/', libroController.getAllLibros);
router.get('/:id', validateZod({ params: libroIdParamSchema }), libroController.getLibroById);
router.put(
  '/:id',
  validateZod({ params: libroIdParamSchema, body: updateLibroSchema }),
  libroController.updateLibro
);
router.delete('/:id', validateZod({ params: libroIdParamSchema }), libroController.deleteLibro);
router.put(
  '/:id/devolver',
  validateZod({ params: libroIdParamSchema }),
  libroController.devolverLibro
);

module.exports = router;
