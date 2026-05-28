const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const HistorialUbicacionObra = sequelize.define('HistorialUbicacionObra', {
  id_movimiento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_obra: { type: DataTypes.INTEGER },
  id_usuario: { type: DataTypes.INTEGER },
  id_estado_anterior: { type: DataTypes.INTEGER },
  id_estado_nuevo: { type: DataTypes.INTEGER },
  observaciones: { type: DataTypes.TEXT },
  fecha_movimiento: { type: DataTypes.DATE }
}, { tableName: 'historial_ubicaciones_obras', timestamps: false });

module.exports = HistorialUbicacionObra;
