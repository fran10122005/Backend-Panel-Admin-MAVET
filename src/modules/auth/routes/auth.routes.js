const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const { z } = require('zod');

// --- Esquemas de validación Zod ---
const forgotPasswordSchema = z.object({
  correo: z.email({ message: 'Debe ser un correo electrónico válido.' }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'El token es requerido.' }),
  nuevaPassword: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const registerSchema = z.object({
  correo: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  id_rol: z.string().min(1, { message: 'El rol del sistema es obligatorio.' }),
  id_trabajador: z.string().optional(),
});

// Rutas públicas
router.post('/register', validateZod(registerSchema), authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', validateZod(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateZod(resetPasswordSchema), authController.resetPassword);

// Rutas protegidas
router.get('/', verifyToken, authController.getAllUsuarios);
router.get('/me', verifyToken, authController.getMe);
router.put('/me', verifyToken, authController.updateMe);
router.put('/:id', verifyToken, authController.updateUsuario);
router.get('/export/pdf', verifyToken, authController.exportUsuariosPdf);

module.exports = router;
