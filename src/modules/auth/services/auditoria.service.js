const { BitacoraAuditoria, Usuario, Role } = require('../../../models');
const { Op } = require('sequelize');

exports.registrar = async ({ id_usuario, correo, tipo, detalle, req }) => {
  try {
    await BitacoraAuditoria.create({
      id_usuario,
      correo: correo || req?.user?.correo,
      tipo,
      detalle,
      ip: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[Auditoria] Error al registrar:', err.message);
  }
};

exports.listar = async ({ page = 1, limit = 25, tipo, desde, hasta }) => {
  const where = {};
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = new Date(desde);
    if (hasta) where.fecha[Op.lte] = new Date(hasta + 'T23:59:59.999Z');
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await BitacoraAuditoria.findAndCountAll({
    where,
    order: [['fecha', 'DESC']],
    limit,
    offset,
    raw: true,
  });

  return {
    data: rows,
    meta: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    },
  };
};
