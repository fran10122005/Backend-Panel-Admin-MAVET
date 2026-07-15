const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { verifyToken, requireRoles } = require('../../../middleware/authMiddleware');

router.get('/', verifyToken, requireRoles('Administrador', 'Gerente'), auditoriaController.listar);

module.exports = router;
