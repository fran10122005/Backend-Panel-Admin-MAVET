const express = require('express');
const router = express.Router();
const validateZod = require('../../../middleware/validateSchema');
const tallerController = require('../controllers/taller.controller');
const inventarioController = require('../controllers/inventarioTaller.controller');
const {
  createInventarioSchema,
  updateInventarioSchema,
  inventarioIdParamSchema,
} = require('../schemas/inventarioTaller.schema');

// ── Inventario de Talleres (must be before /:id) ──
router.get('/inventario', inventarioController.getAllInventario);
router.post(
  '/inventario',
  validateZod({ body: createInventarioSchema }),
  inventarioController.createInventario
);
router.put(
  '/inventario/:id',
  validateZod({ params: inventarioIdParamSchema, body: updateInventarioSchema }),
  inventarioController.updateInventario
);
router.delete(
  '/inventario/:id',
  validateZod({ params: inventarioIdParamSchema }),
  inventarioController.deleteInventario
);

// ── Talleres planificados ──
const {
  createTallerSchema,
  updateTallerSchema,
  planificarTallerSchema,
} = require('../schemas/taller.schema');

router.post('/', validateZod({ body: createTallerSchema }), tallerController.createTaller);
router.get('/', tallerController.getAllTalleres);
router.get('/:id', tallerController.getTallerById);
router.put('/:id', validateZod({ body: updateTallerSchema }), tallerController.updateTaller);
router.delete('/:id', tallerController.deleteTaller);
router.post(
  '/planificar',
  validateZod({ body: planificarTallerSchema }),
  tallerController.planificarTaller
);

module.exports = router;
