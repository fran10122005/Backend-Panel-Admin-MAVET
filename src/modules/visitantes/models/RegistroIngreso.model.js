const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const RegistroIngreso = sequelize.define('RegistroIngreso', {
  id_ingreso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_persona: { type: DataTypes.INTEGER, allowNull: false },
  id_motivo: { type: DataTypes.INTEGER, allowNull: false },
  id_taller: { type: DataTypes.INTEGER, allowNull: true },
  fecha_hora_entrada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'registros_ingresos', 
  timestamps: false 
});

module.exports = RegistroIngreso;
