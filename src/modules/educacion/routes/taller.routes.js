const express = require('express');
const router = express.Router();
const tallerController = require('../controllers/taller.controller');
const inventarioController = require('../controllers/inventarioTaller.controller');

// ── Inventario de Talleres (must be before /:id) ──
router.get('/inventario', inventarioController.getAllInventario);
router.post('/inventario', inventarioController.createInventario);
router.put('/inventario/:id', inventarioController.updateInventario);
router.delete('/inventario/:id', inventarioController.deleteInventario);

// ── Talleres planificados ──
const validateZod = require('../../../middleware/validateSchema');
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
