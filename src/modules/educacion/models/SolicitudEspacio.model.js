const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const SolicitudEspacio = sequelize.define(
  'SolicitudEspacio',
  {
    id_solicitud: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo_reserva: { type: DataTypes.STRING(255) },
    id_espacio: { type: DataTypes.INTEGER, allowNull: false },
    id_persona: { type: DataTypes.INTEGER, allowNull: false },
    institucion: { type: DataTypes.STRING(255) },
    fecha_uso: { type: DataTypes.DATEONLY },
    hora_inicio: { type: DataTypes.TIME },
    hora_fin: { type: DataTypes.TIME },
    motivo: { type: DataTypes.TEXT },
    estado: { type: DataTypes.STRING(255) },
    fecha_creacion: { type: DataTypes.DATE },
    fecha_modificacion: { type: DataTypes.DATE },
  },
  {
    tableName: 'solicitudes_espacios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_modificacion',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = SolicitudEspacio;
