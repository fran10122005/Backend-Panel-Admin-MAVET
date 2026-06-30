const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Artista = sequelize.define(
  'Artista',
  {
    id_artista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombres: { type: DataTypes.STRING(100) },
    apellidos: { type: DataTypes.STRING(100) },
    ci: { type: DataTypes.STRING(20) },
    fecha_nacimiento: { type: DataTypes.DATEONLY },
    telefono: { type: DataTypes.STRING(20) },
    correo: { type: DataTypes.STRING(255) },
    direccion: { type: DataTypes.TEXT },
    nacionalidad: { type: DataTypes.STRING(50) },
  },
  {
    tableName: 'artistas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Artista;
