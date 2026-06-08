const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Libro = sequelize.define('Libro', {
  id_libro:            { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  unidad:              { type: DataTypes.STRING(255) }, // Código de unidad/catalogación
  cuota:               { type: DataTypes.STRING(255) }, // Número largo de catalogación
  titulo:              { type: DataTypes.STRING(255) },
  ano_libro:           { type: DataTypes.INTEGER },      // Año de publicación (solo el número)
  id_categoria:        { type: DataTypes.INTEGER },
  cantidad_total:      { type: DataTypes.INTEGER },
  cantidad_disponible: { type: DataTypes.INTEGER },
  estado:              { type: DataTypes.STRING(255) },
  estante:             { type: DataTypes.STRING(255) }, // Ubicación física en la biblioteca
  fecha_ingreso:       { type: DataTypes.DATEONLY }
}, {
  tableName: 'libros',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
});

module.exports = Libro;
