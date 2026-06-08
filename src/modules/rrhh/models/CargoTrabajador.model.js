const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const CargoTrabajador = sequelize.define('CargoTrabajador', {
  id_cargo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_cargo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'cargos_trabajador',
  timestamps: false,
  
});

module.exports = CargoTrabajador;
