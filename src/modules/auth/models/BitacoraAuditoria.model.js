const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const BitacoraAuditoria = sequelize.define('BitacoraAuditoria', {
  id_auditoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER },
  operacion: { type: DataTypes.STRING(255) },
  tabla_afectada: { type: DataTypes.STRING(255) },
  id_registro_afectado: { type: DataTypes.INTEGER },
  fecha_accion: { type: DataTypes.DATE },
  valores_anteriores: { type: DataTypes.JSON },
  valores_nuevos: { type: DataTypes.JSON }
}, { tableName: 'bitacora_auditoria', timestamps: false });

module.exports = BitacoraAuditoria;
