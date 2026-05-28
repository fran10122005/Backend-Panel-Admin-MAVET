const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const EstadoObra = sequelize.define('EstadoObra', {
  id_estado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_estado: { type: DataTypes.STRING(255) },
  descripcion: { type: DataTypes.TEXT }
}, { 
  tableName: 'estados_obras', 
  timestamps: false 
});

module.exports = EstadoObra;
