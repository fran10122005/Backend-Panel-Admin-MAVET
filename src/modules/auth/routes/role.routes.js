const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const roleController = require('../controllers/role.controller');

const rolesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiadas solicitudes. Intente de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(rolesLimiter);

router.post('/', roleController.createRole);
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
