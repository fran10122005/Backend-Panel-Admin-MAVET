const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const EspacioMuseo = sequelize.define('EspacioMuseo', {
  id_espacio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(255) },
  capacidad: { type: DataTypes.INTEGER }
}, { 
  tableName: 'espacios_museo', 
  timestamps: false 
});

module.exports = EspacioMuseo;
