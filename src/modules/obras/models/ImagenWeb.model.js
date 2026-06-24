const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const ImagenWeb = sequelize.define(
  'ImagenWeb',
  {
    id_imagen: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_obra: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    url: { type: DataTypes.STRING(500), allowNull: false },
    titulo: { type: DataTypes.STRING(255) },
    descripcion: { type: DataTypes.TEXT },
    seccion: { type: DataTypes.STRING(50), defaultValue: 'galeria' },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    orden: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'imagenes_web',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = ImagenWeb;
