const express = require('express');
const configController = require('../controllers/config.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const router = express.Router();

// GET /api/configuracion es público (para la página web)
router.get('/', configController.getConfiguracion);

// PUT /api/configuracion está protegido (para el CMS)
router.use(verifyToken);
router.put('/', configController.updateConfiguracion);

module.exports = router;
