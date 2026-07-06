const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Role = sequelize.define(
  'Role',
  {
    id_rol: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    nombre_rol: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    permisos: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'roles',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ROL-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ROL-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ROL-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    deletedAt: 'deleted_at',
    paranoid: true,
  }
);

module.exports = Role;
