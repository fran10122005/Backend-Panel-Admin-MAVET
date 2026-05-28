const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Taller = sequelize.define('Taller', {
  id_taller: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_curso: { type: DataTypes.STRING(255) },
  id_instructor: { type: DataTypes.INTEGER },
  id_espacio: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.DATEONLY },
  hora_inicio: { type: DataTypes.TIME },
  hora_fin: { type: DataTypes.TIME },
  horas_totales: { type: DataTypes.INTEGER },
  cupo_minimo: { type: DataTypes.INTEGER },
  cupo_maximo: { type: DataTypes.INTEGER },
  costo: { type: DataTypes.DECIMAL },
  estado: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'talleres', 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: 'updated_at', 
  deletedAt: 'deleted_at', 
  paranoid: true 
});

module.exports = Taller;
