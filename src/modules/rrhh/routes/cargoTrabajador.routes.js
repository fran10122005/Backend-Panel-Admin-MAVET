const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoTrabajador.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createCargoTrabajadorSchema,
  updateCargoTrabajadorSchema,
  cargoIdParamSchema,
} = require('../schemas/cargoTrabajador.schema');

router.post('/', validateZod({ body: createCargoTrabajadorSchema }), cargoController.createCargo);
router.get('/', cargoController.getAllCargos);
router.get('/:id', validateZod({ params: cargoIdParamSchema }), cargoController.getCargoById);
router.put(
  '/:id',
  validateZod({ params: cargoIdParamSchema, body: updateCargoTrabajadorSchema }),
  cargoController.updateCargo
);
router.delete('/:id', validateZod({ params: cargoIdParamSchema }), cargoController.deleteCargo);

module.exports = router;
