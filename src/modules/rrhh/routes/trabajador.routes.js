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
  verifyToken,
  validateZod({ body: createTrabajadorSchema }),
  trabajadorController.createTrabajador
);
router.post(
  '/:id/foto',
  upload.single('foto'),
  upload.compress,
  verifyToken,
  trabajadorController.subirFoto
);
router.get('/', verifyToken, trabajadorController.getAllTrabajadores);
router.get(
  '/:id',
  verifyToken,
  validateZod({ params: trabajadorIdParamSchema }),
  trabajadorController.getTrabajadorById
);
router.put(
  '/:id',
  verifyToken,
  validateZod({ params: trabajadorIdParamSchema, body: updateTrabajadorSchema }),
  trabajadorController.updateTrabajador
);
router.delete(
  '/:id',
  verifyToken,
  validateZod({ params: trabajadorIdParamSchema }),
  trabajadorController.deleteTrabajador
);

module.exports = router;
