const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const SesionTaller = sequelize.define('SesionTaller', {
  id_sesion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_taller: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.DATEONLY },
  tema_impartido: { type: DataTypes.STRING(255) }
}, { tableName: 'sesiones_talleres', timestamps: false });

module.exports = SesionTaller;
