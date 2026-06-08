const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Alumno = sequelize.define('Alumno', {
  id_alumno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_persona: { type: DataTypes.INTEGER, allowNull: false },
  nivel_experiencia: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'alumnos', 
  timestamps: false 
});

module.exports = Alumno;
