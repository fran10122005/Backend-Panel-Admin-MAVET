const express = require('express');
const router = express.Router();

const roleRoutes = require('./role.routes');
const authRoutes = require('./auth.routes');

router.use('/roles', roleRoutes);
router.use('/', authRoutes);

module.exports = router;
