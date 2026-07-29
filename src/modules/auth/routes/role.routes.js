const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken } = require('../../../middleware/authMiddleware');

const rolesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 3000,
  message: 'Demasiadas solicitudes. Intente de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(rolesLimiter);
router.use(verifyToken);

router.post('/', roleController.createRole);
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
