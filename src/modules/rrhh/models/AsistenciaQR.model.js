const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AsistenciaQR = sequelize.define('AsistenciaQR', {
  id_asistencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_trabajador: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.DATEONLY },
  entrada_manana: { type: DataTypes.DATE },
  salida_manana: { type: DataTypes.DATE },
  entrada_tarde: { type: DataTypes.DATE },
  salida_tarde: { type: DataTypes.DATE }
}, { tableName: 'asistencias_qr', timestamps: false });

module.exports = AsistenciaQR;
