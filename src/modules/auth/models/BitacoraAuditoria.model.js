const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const BitacoraAuditoria = sequelize.define('BitacoraAuditoria', {
  id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER },
  accion: { type: DataTypes.STRING(255) },
  tabla_afectada: { type: DataTypes.STRING(255) },
  registro_id: { type: DataTypes.INTEGER },
  fecha_hora: { type: DataTypes.DATE }
}, { tableName: 'bitacora_auditoria', timestamps: false });

module.exports = BitacoraAuditoria;
