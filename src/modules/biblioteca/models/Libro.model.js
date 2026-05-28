const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Libro = sequelize.define('Libro', {
  id_libro: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  unidad: { type: DataTypes.STRING(255) },
  titulo: { type: DataTypes.STRING(255) },
  ano_libro: { type: DataTypes.DATEONLY },
  id_categoria: { type: DataTypes.INTEGER },
  cantidad_total: { type: DataTypes.INTEGER },
  cantidad_disponible: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.STRING(255) },
  fecha_ingreso: { type: DataTypes.DATEONLY }
}, { 
  tableName: 'libros', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at', 
  deletedAt: 'deleted_at', 
  paranoid: true 
});

module.exports = Libro;
