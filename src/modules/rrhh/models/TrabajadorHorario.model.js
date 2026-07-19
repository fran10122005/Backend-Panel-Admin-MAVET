const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const AppError = require('../../../utils/AppError');

const TrabajadorHorario = sequelize.define(
  'TrabajadorHorario',
  {
    id_horario: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    id_trabajador: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    dia_semana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 6,
      },
      comment: '0=Domingo, 1=Lunes, ..., 6=Sábado',
    },
    hora_entrada: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00:00',
    },
    hora_salida: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '17:00:00',
    },
    es_dia_laborable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'trabajador_horarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (instance, options) => {
        const pkField = instance.constructor.primaryKeyAttribute;
        if (!pkField || (pkField === 'id' && instance.rawAttributes.id.type.key !== 'STRING'))
          return;

        const lastRecord = await instance.constructor.findOne({
          order: [[pkField, 'DESC']],
          transaction: options.transaction,
          raw: true,
          paranoid: false,
        });

        let newNumber = 1;
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('THO-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('THO-', ''), 10);
          if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        instance[pkField] = `THO-${String(newNumber).padStart(5, '0')}`;
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['id_trabajador', 'dia_semana'],
        name: 'unique_trabajador_dia',
      },
    ],
  }
);

module.exports = TrabajadorHorario;
