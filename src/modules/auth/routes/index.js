const express = require('express');
const router = express.Router();

const roleRoutes = require('./role.routes');

router.use('/roles', roleRoutes);

module.exports = router;
