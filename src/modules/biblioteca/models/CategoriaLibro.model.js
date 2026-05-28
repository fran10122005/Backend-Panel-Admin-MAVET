const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const CategoriaLibro = sequelize.define('CategoriaLibro', {
  id_categoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_categoria: { type: DataTypes.STRING(255) },
  ubicacion_estante: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'categorias_libros', 
  timestamps: false 
});

module.exports = CategoriaLibro;
