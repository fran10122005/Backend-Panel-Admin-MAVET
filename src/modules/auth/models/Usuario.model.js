const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_trabajador: { type: DataTypes.INTEGER },
  correo: { type: DataTypes.STRING(255), unique: true },
  password_hash: { type: DataTypes.STRING(255) },
  id_rol: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.BOOLEAN }
}, { tableName: 'usuarios', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at', paranoid: true });

module.exports = Usuario;
