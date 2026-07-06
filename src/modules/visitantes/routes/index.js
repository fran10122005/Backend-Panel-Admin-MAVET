const express = require('express');
const router = express.Router();

const motivoRoutes = require('./motivoVisita.routes');
const ingresoRoutes = require('./ingreso.routes');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.use('/motivos', motivoRoutes);
router.use('/ingresos', ingresoRoutes);

module.exports = router;
