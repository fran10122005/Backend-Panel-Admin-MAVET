const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const ConfiguracionWeb = sequelize.define(
  'ConfiguracionWeb',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clave: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'configuracion_web',
    timestamps: true,
  }
);

module.exports = ConfiguracionWeb;
