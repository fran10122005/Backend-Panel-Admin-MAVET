const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AlumnoRepresentante = sequelize.define(
  'AlumnoRepresentante',
  {
    id_alumno: { type: DataTypes.STRING(15), primaryKey: true },
    id_representante: { type: DataTypes.STRING(15), primaryKey: true },
    parentesco: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'alumnos_representantes',
    timestamps: false,
  }
);

module.exports = AlumnoRepresentante;
