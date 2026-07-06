const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Entrega = sequelize.define(
  'Entrega',
  {
    id_entrega: { type: DataTypes.STRING(15), primaryKey: true },
    nombre: { type: DataTypes.STRING(255) },
    apellido: { type: DataTypes.STRING(255) },
    cedula: { type: DataTypes.STRING(255) },
    telefono: { type: DataTypes.STRING(255) },
    institucion: { type: DataTypes.STRING(255) },
    fecha_entrega: { type: DataTypes.DATEONLY },
    acta_donacion_url: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'entrega',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ENT-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ENT-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ENT-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Entrega;
