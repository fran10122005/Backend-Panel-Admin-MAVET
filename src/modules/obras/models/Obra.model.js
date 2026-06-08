const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Obra = sequelize.define('Obra', {
  id_obra: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_entrega: { type: DataTypes.INTEGER },
  codigo_inventario: { type: DataTypes.STRING(255), unique: true },
  titulo: { type: DataTypes.STRING(255) },
  id_artista: { type: DataTypes.INTEGER },
  anio: { type: DataTypes.INTEGER },
  medidas: { type: DataTypes.STRING(255) },
  peso: { type: DataTypes.NUMERIC },
  id_tecnica: { type: DataTypes.INTEGER },
  imagen_url: { type: DataTypes.STRING(255) },
  tipo_ingreso: { type: DataTypes.STRING(255) },
  id_estado_actual: { type: DataTypes.INTEGER },
  ubicacion_actual: { type: DataTypes.STRING(255) },
  piezas: { type: DataTypes.INTEGER },
  modalidad: { type: DataTypes.STRING(255) },
  id_categoria_obra: { type: DataTypes.INTEGER },
  descripcion: { type: DataTypes.TEXT }
}, { 
  tableName: 'obras', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at'
});

module.exports = Obra;
