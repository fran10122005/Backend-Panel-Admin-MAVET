const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AutorLibro = sequelize.define(
  'AutorLibro',
  {
    id_autor: { type: DataTypes.STRING(15), primaryKey: true },
    nombre: { type: DataTypes.STRING(255) },
    apellido: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'autores_libros',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ALI-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ALI-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ALI-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = AutorLibro;
