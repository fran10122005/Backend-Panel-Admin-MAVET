const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas (ejemplo de obtener mi perfil)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
