const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Trabajador = sequelize.define('Trabajador', {
  id_trabajador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_horario:    { type: DataTypes.INTEGER, allowNull: true },
  id_usuario:    { type: DataTypes.INTEGER, allowNull: true },
  cedula:        { type: DataTypes.STRING(255), unique: true, allowNull: false },
  nombres:       { type: DataTypes.STRING(255), allowNull: false },
  apellidos:     { type: DataTypes.STRING(255), allowNull: false },
  telefono:      { type: DataTypes.STRING(20),  allowNull: true },
  correo_personal: { type: DataTypes.STRING(255), allowNull: true },
  id_cargo:      { type: DataTypes.INTEGER, allowNull: false },
  horas_semanales: { type: DataTypes.DECIMAL, allowNull: true },
  qr_uuid:       { type: DataTypes.STRING(255), unique: true },
  estado:        { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'trabajadores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Trabajador;
