const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Representante = sequelize.define(
  'Representante',
  {
    id_representante: { type: DataTypes.STRING(15), primaryKey: true },
    id_persona: { type: DataTypes.STRING(15), allowNull: false },
    profesion_ocupacion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'representantes',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('REP-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('REP-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `REP-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = Representante;
