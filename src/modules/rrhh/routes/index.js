const express = require('express');
const router = express.Router();

const cargoRoutes = require('./cargoTrabajador.routes');
const turnoRoutes = require('./turno.routes');
const trabajadorRoutes = require('./trabajador.routes');

router.use('/cargos', cargoRoutes);
router.use('/turnos', turnoRoutes);
router.use('/trabajadores', trabajadorRoutes);

module.exports = router;
