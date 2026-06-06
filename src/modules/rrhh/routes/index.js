const express = require('express');
const router = express.Router();

const cargoRoutes = require('./cargoTrabajador.routes');
const turnoRoutes = require('./turno.routes');
const trabajadorRoutes = require('./trabajador.routes');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.use('/cargos', verifyToken, cargoRoutes);
router.use('/turnos', verifyToken, turnoRoutes);
router.use('/trabajadores', verifyToken, trabajadorRoutes);
router.use('/asistencias', require('./asistenciaQR.routes'));

module.exports = router;
