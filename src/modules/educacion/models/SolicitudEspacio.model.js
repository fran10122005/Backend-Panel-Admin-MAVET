const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const SolicitudEspacio = sequelize.define('SolicitudEspacio', {
  id_solicitud: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_espacio: { type: DataTypes.INTEGER },
  nombre_responsable: { type: DataTypes.STRING(255) },
  institucion: { type: DataTypes.STRING(255) },
  fecha_solicitada: { type: DataTypes.DATEONLY },
  hora_inicio: { type: DataTypes.TIME },
  hora_fin: { type: DataTypes.TIME },
  motivo_uso: { type: DataTypes.TEXT },
  estado_solicitud: { type: DataTypes.STRING(255) },
  id_usuario_aprobador: { type: DataTypes.INTEGER },
  fecha_creacion: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE }
}, { tableName: 'solicitudes_espacios', timestamps: true, createdAt: 'fecha_creacion', updatedAt: 'updated_at' });

module.exports = SolicitudEspacio;
