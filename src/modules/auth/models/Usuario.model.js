const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  correo: { type: DataTypes.STRING(255), unique: true },
  password_hash: { type: DataTypes.STRING(255) },
  id_rol: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.BOOLEAN },
  // Campos para recuperación de contraseña
  
  
}, { tableName: 'usuarios', timestamps: false });

module.exports = Usuario;
