const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Trabajador = sequelize.define(
  'Trabajador',
  {
    id_trabajador: { type: DataTypes.STRING(15), primaryKey: true },
    id_usuario: { type: DataTypes.STRING(15), allowNull: true },
    cedula: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    nombres: { type: DataTypes.STRING(255), allowNull: false },
    apellidos: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    correo_personal: { type: DataTypes.STRING(255), allowNull: true },
    id_cargo: { type: DataTypes.STRING(15), allowNull: false },
    horas_semanales: { type: DataTypes.DECIMAL, allowNull: true },
    qr_uuid: { type: DataTypes.STRING(255), unique: true },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
    foto_url: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'trabajadores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: true,
    deletedAt: 'deleted_at',
    hooks: {
      beforeCreate: (trabajador) => {
        if (!trabajador.qr_uuid) {
          const crypto = require('crypto');
          trabajador.qr_uuid = crypto.randomUUID();
        }
      },
    },
  }
);

module.exports = Trabajador;
