const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const HistorialHorario = sequelize.define('HistorialHorario', {
  id_historial:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_trabajador:     { type: DataTypes.INTEGER, allowNull: false },
  horas_anteriores:  { type: DataTypes.DECIMAL },
  horas_nuevas:      { type: DataTypes.DECIMAL, allowNull: false },
  motivo:            { type: DataTypes.TEXT, allowNull: false },
  id_usuario_modifica: { type: DataTypes.INTEGER },
  fecha_cambio:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'historial_horario', timestamps: false });

module.exports = HistorialHorario;
