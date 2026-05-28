const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AsistenciaAlumno = sequelize.define('AsistenciaAlumno', {
  id_asistencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sesion: { type: DataTypes.INTEGER },
  id_alumno: { type: DataTypes.INTEGER },
  asistio: { type: DataTypes.BOOLEAN }
}, { tableName: 'asistencias_alumnos', timestamps: false });

module.exports = AsistenciaAlumno;
