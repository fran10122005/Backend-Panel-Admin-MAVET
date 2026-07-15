const express = require('express');
const router = express.Router();

const roleRoutes = require('./role.routes');
const authRoutes = require('./auth.routes');
const auditoriaRoutes = require('./auditoria.routes');

router.use('/roles', roleRoutes);
router.use('/', authRoutes);
router.use('/logs', auditoriaRoutes);

module.exports = router;
