const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaSala.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createConsultaSalaSchema,
  updateConsultaSalaSchema,
  consultaSalaIdParamSchema,
  consultaFiltrosSchema,
  estadisticasSchema,
} = require('../schemas/consultaSala.schema');

router.post(
  '/',
  validateZod({ body: createConsultaSalaSchema }),
  consultaController.createConsulta
);

router.get(
  '/filtradas',
  validateZod({ query: consultaFiltrosSchema }),
  consultaController.getConsultasFiltradas
);

router.get(
  '/estadisticas',
  validateZod({ query: estadisticasSchema }),
  consultaController.getEstadisticas
);

router.get('/', consultaController.getAllConsultas);

router.put(
  '/:id',
  validateZod({ params: consultaSalaIdParamSchema, body: updateConsultaSalaSchema }),
  consultaController.updateConsulta
);

module.exports = router;
