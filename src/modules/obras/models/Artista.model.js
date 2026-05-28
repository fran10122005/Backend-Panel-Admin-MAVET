const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Artista = sequelize.define('Artista', {
  id_artista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombres: { type: DataTypes.STRING(255) },
  apellidos: { type: DataTypes.STRING(255) },
  CI: { type: DataTypes.STRING(255) },
  correo: { type: DataTypes.STRING(255) },
  fecha_nacimiento: { type: DataTypes.DATEONLY },
  telefono: { type: DataTypes.STRING(255) },
  email: { type: DataTypes.STRING(255) },
  direccion: { type: DataTypes.STRING(255) },
  nacionalidad: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'artistas', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at', 
  deletedAt: 'deleted_at', 
  paranoid: true 
});

module.exports = Artista;
