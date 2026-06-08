const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const CategoriaObra = sequelize.define('CategoriaObra', {
  id_categoria_obra: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_categoria: { type: DataTypes.STRING(255) },
  descripcion: { type: DataTypes.TEXT }
}, { 
  tableName: 'categoria_obra', 
  timestamps: false 
});

module.exports = CategoriaObra;
