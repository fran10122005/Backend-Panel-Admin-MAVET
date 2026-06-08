const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Role = sequelize.define('Role', {
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_rol: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  permisos: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: false,
  updatedAt: false,
  deletedAt: 'deleted_at',
  paranoid: true
});

module.exports = Role;
