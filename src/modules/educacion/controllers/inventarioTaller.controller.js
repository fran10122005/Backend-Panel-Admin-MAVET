const inventarioTallerService = require('../services/inventarioTaller.service');
const { body, param, validationResult } = require('express-validator');

// GET /api/educacion/talleres/inventario
exports.getAllInventario = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const result = await inventarioTallerService.getAll(page, limit);
    res.status(200).json({
      data: result.data || result,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/educacion/talleres/inventario
exports.createInventario = [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('descripcion').optional(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const nuevo = await inventarioTallerService.create(req.body);
      res.status(201).json({ message: 'Inventario creado', data: nuevo });
    } catch (err) {
      next(err);
    }
  },
];

// PUT /api/educacion/talleres/inventario/:id
exports.updateInventario = [
  param('id').isString().withMessage('ID inválido'),
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('descripcion').optional(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const actualizado = await inventarioTallerService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Inventario actualizado', data: actualizado });
    } catch (err) {
      next(err);
    }
  },
];

// DELETE /api/educacion/talleres/inventario/:id
exports.deleteInventario = [
  param('id').isString().withMessage('ID inválido'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await inventarioTallerService.remove(req.params.id);
      res.status(200).json({ message: 'Taller eliminado del inventario' });
    } catch (err) {
      next(err);
    }
  },
];
