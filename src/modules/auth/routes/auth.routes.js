const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');
const validateZod = require('../../../middleware/validateSchema');
const { z } = require('zod');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiadas solicitudes. Intente de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

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
router.post('/register', sensitiveLimiter, validateZod(registerSchema), authController.register);
router.post('/login', loginLimiter, authController.login);
router.post(
  '/forgot-password',
  sensitiveLimiter,
  validateZod(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  sensitiveLimiter,
  validateZod(resetPasswordSchema),
  authController.resetPassword
);

// Rutas protegidas
router.get('/', verifyToken, authController.getAllUsuarios);
router.get('/me', verifyToken, authController.getMe);
router.put('/me', verifyToken, authController.updateMe);
router.put('/me/password', verifyToken, authController.changePassword);
router.put('/:id', verifyToken, authController.updateUsuario);
router.delete('/:id', verifyToken, authController.deleteUsuario);
router.get('/export/pdf', verifyToken, authController.exportUsuariosPdf);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
