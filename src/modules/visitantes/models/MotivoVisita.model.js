const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const MotivoVisita = sequelize.define(
  'MotivoVisita',
  {
    id_motivo: { type: DataTypes.STRING(15), primaryKey: true },
    nombre: { type: DataTypes.STRING(255) },
    descripcion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'motivos_visita',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('MVI-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('MVI-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `MVI-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = MotivoVisita;
