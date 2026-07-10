const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudEspacio.controller');
const validateZod = require('../../../middleware/validateSchema');
const {
  createSolicitudSchema,
  updateSolicitudSchema,
} = require('../schemas/solicitudEspacio.schema');

router.post('/', validateZod(createSolicitudSchema), solicitudController.createSolicitud);
router.get('/', solicitudController.getAllSolicitudes);
router.get('/:id', solicitudController.getSolicitudById);
router.put('/:id', validateZod(updateSolicitudSchema), solicitudController.updateSolicitud);
router.delete('/:id', solicitudController.deleteSolicitud);

module.exports = router;
