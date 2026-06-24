const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Persona = sequelize.define(
  'Persona',
  {
    id_persona: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cedula: { type: DataTypes.STRING(255), unique: true },
    nombres: { type: DataTypes.STRING(255), allowNull: false },
    apellidos: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(255), allowNull: true },
    fecha_de_nac: { type: DataTypes.DATEONLY, allowNull: true },
    correo: { type: DataTypes.STRING(255), allowNull: true },
    fecha_registro: { type: DataTypes.DATE },
  },
  {
    tableName: 'personas',
    timestamps: false,
  }
);

module.exports = Persona;
