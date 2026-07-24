const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const TipoEvento = sequelize.define(
  'TipoEvento',
  {
    id_tipo_evento: { type: DataTypes.STRING(15), primaryKey: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'tipos_evento',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TEV-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TEV-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TEV-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = TipoEvento;
