const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const CategoriaLibro = sequelize.define(
  'CategoriaLibro',
  {
    id_categoria: { type: DataTypes.STRING(15), primaryKey: true },
    nombre_categoria: { type: DataTypes.STRING(255) },
    ubicacion_estante: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'categorias_libros',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('CLI-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('CLI-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `CLI-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = CategoriaLibro;
