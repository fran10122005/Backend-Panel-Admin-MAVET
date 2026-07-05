const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Visitante = sequelize.define('Visitante', {
  id_visitante: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cedula: { type: DataTypes.STRING(20) },
  nombres: { type: DataTypes.STRING(255) },
  apellidos: { type: DataTypes.STRING(255) },
  telefono: { type: DataTypes.STRING(20) },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  institucion_profesion: { type: DataTypes.STRING(255) }
}, {
  tableName: 'visitantes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Visitante;
