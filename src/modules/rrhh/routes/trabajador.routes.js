const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajador.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createTrabajadorSchema,
  updateTrabajadorSchema,
  trabajadorIdParamSchema,
} = require('../schemas/trabajador.schema');

const upload = require('../../../middleware/uploadMiddleware');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.post(
  '/',
  validateZod({ body: createTrabajadorSchema }),
  trabajadorController.createTrabajador
);
router.post('/:id/foto', verifyToken, upload.single('foto'), trabajadorController.subirFoto);
router.get('/', trabajadorController.getAllTrabajadores);
router.get(
  '/:id',
  validateZod({ params: trabajadorIdParamSchema }),
  trabajadorController.getTrabajadorById
);
router.put(
  '/:id',
  validateZod({ params: trabajadorIdParamSchema, body: updateTrabajadorSchema }),
  trabajadorController.updateTrabajador
);
router.delete(
  '/:id',
  validateZod({ params: trabajadorIdParamSchema }),
  trabajadorController.deleteTrabajador
);

module.exports = router;
