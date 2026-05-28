const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const InscripcionTaller = sequelize.define('InscripcionTaller', {
  id_inscripcion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_taller: { type: DataTypes.INTEGER },
  id_alumno: { type: DataTypes.INTEGER },
  fecha_inscripcion: { type: DataTypes.DATEONLY },
  estado_inscripcion: { type: DataTypes.STRING(255) }
}, { tableName: 'inscripciones_talleres', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = InscripcionTaller;
