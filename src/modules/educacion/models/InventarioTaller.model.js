const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const InventarioTaller = sequelize.define('InventarioTaller', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'inventario_talleres',
  timestamps: true,
  underscored: true,
});

module.exports = InventarioTaller;
