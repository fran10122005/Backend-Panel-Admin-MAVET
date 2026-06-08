const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Horario = sequelize.define('Horario', {
  id_horario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  horas_semanales_requeridas: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  horas_semanales_acumuladas: {
    type: DataTypes.DECIMAL,
    defaultValue: 0
  },
  nombre_turno: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'horario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Horario;
