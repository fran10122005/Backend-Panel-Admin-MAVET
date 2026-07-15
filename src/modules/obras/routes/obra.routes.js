const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obra.controller');
const historialController = require('../controllers/historialObra.controller');
const upload = require('../../../middleware/uploadMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const {
  createObraSchema,
  updateObraSchema,
  getObrasQuerySchema,
  obraIdParamSchema,
} = require('../schemas/obra.schema');

router.post(
  '/',
  upload.single('imagen'),
  upload.compress,
  validateZod({ body: createObraSchema }),
  obraController.createObra
);
router.get('/', validateZod({ query: getObrasQuerySchema }), obraController.getAllObras);
router.get('/:id', validateZod({ params: obraIdParamSchema }), obraController.getObraById);
router.put(
  '/:id',
  upload.single('imagen'),
  upload.compress,
  validateZod({ params: obraIdParamSchema, body: updateObraSchema }),
  obraController.updateObra
);
router.delete('/:id', validateZod({ params: obraIdParamSchema }), obraController.deleteObra);

router.get(
  '/:id/historial',
  validateZod({ params: obraIdParamSchema }),
  historialController.obtenerHistorial
);
router.post(
  '/:id/historial',
  validateZod({ params: obraIdParamSchema }),
  historialController.registrarMovimiento
);
router.get('/:id/historial/:idMov', historialController.obtenerMovimientoPorId);

module.exports = router;
