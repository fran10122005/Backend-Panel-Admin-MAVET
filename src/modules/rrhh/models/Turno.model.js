const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Turno = sequelize.define('Turno', {
  id_turno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_turno: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dias_trabajo: {
    type: DataTypes.STRING(255)
  },
  hora_entrada: {
    type: DataTypes.TIME
  },
  hora_salida: {
    type: DataTypes.TIME
  }
}, {
  tableName: 'turnos',
  timestamps: false
});

module.exports = Turno;
