const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const ConsultaSala = sequelize.define('ConsultaSala', {
  id_consulta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_libro: { type: DataTypes.INTEGER },
  id_visitante: { type: DataTypes.INTEGER },
  mesa: { type: DataTypes.STRING(255) },
  estado_entrega: { type: DataTypes.STRING(255) },
  estado_devolucion: { type: DataTypes.STRING(255) },
  fecha_hora_inicio: { type: DataTypes.DATE },
  fecha_hora_fin: { type: DataTypes.DATE }
}, { tableName: 'consultas_sala', timestamps: false });

module.exports = ConsultaSala;
