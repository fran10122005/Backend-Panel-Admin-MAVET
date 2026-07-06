const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Turno = sequelize.define(
  'Turno',
  {
    id_turno: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    nombre_turno: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    dias_trabajo: {
      type: DataTypes.STRING(255),
    },
    hora_entrada: {
      type: DataTypes.TIME,
    },
    hora_salida: {
      type: DataTypes.TIME,
    },
  },
  {
    tableName: 'turnos',
    hooks: {
      beforeCreate: async (instance, options) => {
        // Obtenemos el nombre de la clave primaria
        const pkField = instance.constructor.primaryKeyAttribute;
        if (!pkField || (pkField === 'id' && instance.rawAttributes.id.type.key !== 'STRING'))
          return; // En caso de tablas pivot sin PK explícito

        const lastRecord = await instance.constructor.findOne({
          order: [[pkField, 'DESC']],
          transaction: options.transaction,
          raw: true,
          paranoid: false, // Para incluir registros eliminados si hay soft deletes
        });

        let newNumber = 1;
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TUR-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TUR-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TUR-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = Turno;
