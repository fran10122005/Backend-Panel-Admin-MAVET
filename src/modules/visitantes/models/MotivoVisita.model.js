const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const MotivoVisita = sequelize.define('MotivoVisita', {
  id_motivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(255) },
  descripcion: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'motivos_visita', 
  timestamps: false 
});

module.exports = MotivoVisita;
