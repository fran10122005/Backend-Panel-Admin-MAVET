const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const RegistroIngreso = sequelize.define('RegistroIngreso', {
  id_ingreso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_visitante: { type: DataTypes.INTEGER },
  id_motivo: { type: DataTypes.INTEGER },
  id_taller: { type: DataTypes.INTEGER },
  fecha_hora_entrada: { type: DataTypes.DATE }
}, { tableName: 'registros_ingresos', timestamps: false });

module.exports = RegistroIngreso;
