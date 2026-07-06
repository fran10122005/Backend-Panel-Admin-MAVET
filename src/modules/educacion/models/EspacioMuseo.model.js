const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const EspacioMuseo = sequelize.define(
  'EspacioMuseo',
  {
    id_espacio: { type: DataTypes.STRING(15), primaryKey: true },
    codigo_espacio: { type: DataTypes.STRING(255) },
    nombre: { type: DataTypes.STRING(255) },
    capacidad: { type: DataTypes.STRING(15) },
    descripcion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'espacios_museo',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('EMU-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('EMU-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `EMU-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = EspacioMuseo;
