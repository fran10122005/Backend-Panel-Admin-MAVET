const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const TecnicaObra = sequelize.define('TecnicaObra', {
  id_tecnica: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_tecnica: { type: DataTypes.STRING(255) },
  descripcion: { type: DataTypes.TEXT }
}, { 
  tableName: 'tecnicas_obras', 
  timestamps: false 
});

module.exports = TecnicaObra;
