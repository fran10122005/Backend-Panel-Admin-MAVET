const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Instructor = sequelize.define('Instructor', {
  id_instructor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cedula: { type: DataTypes.STRING(255), unique: true },
  nombres: { type: DataTypes.STRING(255) },
  apellidos: { type: DataTypes.STRING(255) },
  telefono: { type: DataTypes.STRING(255) },
  email: { type: DataTypes.STRING(255) },
  origen_interno_externo: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'instructores', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = Instructor;
