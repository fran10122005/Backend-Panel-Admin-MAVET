const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/authMiddleware');
const upload = require('../../../middleware/uploadMiddleware');
const trabajadorDocumentoController = require('../controllers/trabajadorDocumento.controller');
const trabajadorHorarioController = require('../controllers/trabajadorHorario.controller');
const trabajadorJustificacionController = require('../controllers/trabajadorJustificacion.controller');
const minutaHorarioController = require('../controllers/minutaHorario.controller');

router.use(verifyToken);

// ==========================================
// TRABAJADOR - DOCUMENTOS
// ==========================================
router.post(
  '/:id_trabajador/documentos',
  upload.document.single('archivo'),
  trabajadorDocumentoController.subirDocumento
);
router.get('/:id_trabajador/documentos', trabajadorDocumentoController.obtenerDocumentos);
router.get('/:id_trabajador/documentos/tipos', trabajadorDocumentoController.obtenerTiposDocumento);
router.get(
  '/:id_trabajador/documentos/:id_documento',
  trabajadorDocumentoController.obtenerDocumentoPorId
);
router.delete(
  '/:id_trabajador/documentos/:id_documento',
  trabajadorDocumentoController.eliminarDocumento
);

// ==========================================
// TRABAJADOR - HORARIOS
// ==========================================
router.post('/:id_trabajador/horarios', trabajadorHorarioController.crearHorario);
router.post('/:id_trabajador/horarios/bulk', trabajadorHorarioController.guardarHorariosMasivos);
router.post(
  '/:id_trabajador/horarios/completos',
  trabajadorHorarioController.crearHorariosCompletos
);
router.get('/:id_trabajador/horarios', trabajadorHorarioController.obtenerHorarios);
router.get(
  '/:id_trabajador/horarios/completos',
  trabajadorHorarioController.obtenerHorariosCompletos
);
router.get('/horarios/dias-semana', trabajadorHorarioController.obtenerDiasSemana);
router.put('/:id_trabajador/horarios/:dia_semana', trabajadorHorarioController.actualizarHorario);
router.delete('/:id_trabajador/horarios/:dia_semana', trabajadorHorarioController.eliminarHorario);

// ==========================================
// TRABAJADOR - MINUTA DE HORARIO
// ==========================================
router.post(
  '/:id_trabajador/horarios/minuta',
  upload.document.single('archivo'),
  minutaHorarioController.subirMinuta
);
router.get('/:id_trabajador/horarios/minuta', minutaHorarioController.obtenerMinuta);
router.delete('/:id_trabajador/horarios/minuta', minutaHorarioController.eliminarMinuta);

// ==========================================
// TRABAJADOR - JUSTIFICACIONES
// ==========================================
router.post(
  '/:id_trabajador/justificaciones',
  upload.document.single('archivo'),
  trabajadorJustificacionController.crearJustificacion
);
router.get(
  '/:id_trabajador/justificaciones',
  trabajadorJustificacionController.obtenerJustificaciones
);
router.get('/:id_trabajador/justificaciones/tipos', trabajadorJustificacionController.obtenerTipos);
router.get(
  '/:id_trabajador/justificaciones/estados',
  trabajadorJustificacionController.obtenerEstados
);
router.get(
  '/:id_trabajador/justificaciones/estadisticas',
  trabajadorJustificacionController.obtenerEstadisticas
);
router.get(
  '/:id_trabajador/justificaciones/:id_justificacion',
  trabajadorJustificacionController.obtenerJustificacionPorId
);
router.put(
  '/:id_trabajador/justificaciones/:id_justificacion/estado',
  trabajadorJustificacionController.actualizarEstado
);
router.delete(
  '/:id_trabajador/justificaciones/:id_justificacion',
  trabajadorJustificacionController.eliminarJustificacion
);

module.exports = router;
