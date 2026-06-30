const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Taller = sequelize.define(
  'Taller',
  {
    id_taller: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_curso: { type: DataTypes.STRING(255) },
    inventario_id: { type: DataTypes.INTEGER },
    id_instructor: { type: DataTypes.INTEGER },
    id_espacio: { type: DataTypes.INTEGER },
    sesiones: { type: DataTypes.INTEGER },
    fecha: { type: DataTypes.DATEONLY },
    hora_inicio: { type: DataTypes.TIME },
    hora_fin: { type: DataTypes.TIME },
    horas_totales: { type: DataTypes.INTEGER },
    cupo_minimo: { type: DataTypes.INTEGER },
    cupo_maximo: { type: DataTypes.INTEGER },

    estado: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'talleres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Taller;
