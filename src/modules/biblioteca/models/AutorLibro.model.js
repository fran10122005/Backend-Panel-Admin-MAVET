const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AutorLibro = sequelize.define('AutorLibro', {
  id_autor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(255) },
  apellido: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'autores_libros', 
  timestamps: false 
});

module.exports = AutorLibro;
