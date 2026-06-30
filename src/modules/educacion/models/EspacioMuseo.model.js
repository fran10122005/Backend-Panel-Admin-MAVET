const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const EspacioMuseo = sequelize.define(
  'EspacioMuseo',
  {
    id_espacio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo_espacio: { type: DataTypes.STRING(255) },
    nombre: { type: DataTypes.STRING(255) },
    capacidad: { type: DataTypes.INTEGER },
    descripcion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'espacios_museo',
    timestamps: false,
  }
);

module.exports = EspacioMuseo;
