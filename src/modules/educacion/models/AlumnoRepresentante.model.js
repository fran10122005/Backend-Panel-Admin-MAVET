const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AlumnoRepresentante = sequelize.define('AlumnoRepresentante', {
  id_alumno: { type: DataTypes.INTEGER, allowNull: false },
  id_representante: { type: DataTypes.INTEGER, allowNull: false },
  parentesco: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'alumnos_representantes', 
  timestamps: false
});

module.exports = AlumnoRepresentante;
