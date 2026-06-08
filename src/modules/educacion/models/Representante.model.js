const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Representante = sequelize.define('Representante', {
  id_representante: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_persona: { type: DataTypes.INTEGER, allowNull: false },
  profesion_ocupacion: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'representantes', 
  timestamps: false 
});

module.exports = Representante;
