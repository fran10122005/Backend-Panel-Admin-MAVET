const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const RegistroIngreso = sequelize.define(
  'RegistroIngreso',
  {
    id_ingreso: { type: DataTypes.STRING(15), primaryKey: true },
    id_persona: { type: DataTypes.STRING(15), allowNull: false },
    id_motivo: { type: DataTypes.STRING(15), allowNull: false },
    id_taller: { type: DataTypes.STRING(15), allowNull: true },
    cantidad_acompanantes: { type: DataTypes.STRING(15), defaultValue: 0 },
    fecha_hora_entrada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'registros_ingresos',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('RIN-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('RIN-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `RIN-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = RegistroIngreso;
