const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Representante = sequelize.define('Representante', {
  id_representante: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cedula: { type: DataTypes.STRING(255) },
  nombres: { type: DataTypes.STRING(255) },
  apellido: { type: DataTypes.STRING(255) },
  telefono: { type: DataTypes.STRING(255) },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  Profesion: { type: DataTypes.STRING(255) },
  documento_identidad_url: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'representantes', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at' 
});

module.exports = Representante;
