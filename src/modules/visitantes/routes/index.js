const express = require('express');
const router = express.Router();

const motivoRoutes = require('./motivoVisita.routes');
const visitanteRoutes = require('./visitante.routes');

router.use('/motivos', motivoRoutes);
router.use('/visitantes', visitanteRoutes);

module.exports = router;
