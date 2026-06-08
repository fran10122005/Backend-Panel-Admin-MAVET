const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Instructor = sequelize.define('Instructor', {
  id_instructor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_persona: { type: DataTypes.INTEGER, allowNull: false },
  profesion: { type: DataTypes.STRING(255) },
  especialidad: { type: DataTypes.STRING(255) }
}, { 
  tableName: 'instructores', 
  timestamps: false 
});

module.exports = Instructor;
