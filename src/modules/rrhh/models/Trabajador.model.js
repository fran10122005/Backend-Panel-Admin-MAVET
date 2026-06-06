const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Trabajador = sequelize.define('Trabajador', {
  id_trabajador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cedula: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false
  },
  nombres: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(255)
  },
  correo_personal: {
    type: DataTypes.STRING(255)
  },
  id_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  qr_uuid: {
    type: DataTypes.STRING(255),
    unique: true
  },
  estado: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'trabajadores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Trabajador;
