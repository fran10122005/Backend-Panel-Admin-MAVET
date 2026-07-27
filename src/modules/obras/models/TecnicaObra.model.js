const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const TecnicaObra = sequelize.define(
  'TecnicaObra',
  {
    id_tecnica: { type: DataTypes.STRING(15), primaryKey: true },
    nombre_tecnica: { type: DataTypes.STRING(255) },
    id_categoria_obra: { type: DataTypes.STRING(15) },
  },
  {
    tableName: 'tecnicas_obras',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TOB-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TOB-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TOB-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = TecnicaObra;
