const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Alumno = sequelize.define('Alumno', {
  id_alumno: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_representante: { type: DataTypes.INTEGER },
  cedula: { type: DataTypes.STRING(255), unique: true },
  nombres: { type: DataTypes.STRING(255) },
  apellidos: { type: DataTypes.STRING(255) },
  telefono: { type: DataTypes.STRING(255) },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  direccion: { type: DataTypes.TEXT }
}, { 
  tableName: 'alumnos', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = Alumno;
