const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const CategoriaObra = sequelize.define(
  'CategoriaObra',
  {
    id_categoria_obra: { type: DataTypes.STRING(15), primaryKey: true },
    nombre_categoria: { type: DataTypes.STRING(255) },
    descripcion: { type: DataTypes.TEXT },
  },
  {
    tableName: 'categoria_obra',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('COB-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('COB-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `COB-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = CategoriaObra;
