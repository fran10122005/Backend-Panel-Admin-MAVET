const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Entrega = sequelize.define('Entrega', {
  id_entrega: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(255) },
  apellido: { type: DataTypes.STRING(255) },
  cedula: { type: DataTypes.STRING(255) },
  telefono: { type: DataTypes.STRING(255) },
  institucion: { type: DataTypes.STRING(255) },
  fecha_entrega: { type: DataTypes.DATEONLY },
  acta_donacion_url: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'entrega', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at'
});

module.exports = Entrega;
