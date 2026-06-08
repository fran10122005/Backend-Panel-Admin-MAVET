const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const ConsultaSala = sequelize.define('ConsultaSala', {
  id_consulta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_libro: { type: DataTypes.INTEGER, allowNull: false },
  id_persona: { type: DataTypes.INTEGER, allowNull: true },
  id_trabajador: { type: DataTypes.INTEGER, allowNull: true },
  estado: { type: DataTypes.STRING(255) },
  hora_entrega: { type: DataTypes.DATE },
  hora_devolucion: { type: DataTypes.DATE, allowNull: true },
  observaciones: { type: DataTypes.TEXT }
}, { 
  tableName: 'consultas_sala', 
  timestamps: false 
});

module.exports = ConsultaSala;
