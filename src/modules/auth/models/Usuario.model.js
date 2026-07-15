const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Usuario = sequelize.define(
  'Usuario',
  {
    id_usuario: { type: DataTypes.STRING(15), primaryKey: true },

    correo: { type: DataTypes.STRING(255), unique: true },
    password_hash: { type: DataTypes.STRING(255) },
    id_rol: { type: DataTypes.STRING(15) },
    estado: { type: DataTypes.BOOLEAN },
    foto_url: { type: DataTypes.STRING(500), allowNull: true },
    reset_password_token: { type: DataTypes.STRING(255), allowNull: true },
    reset_password_expires: { type: DataTypes.DATE, allowNull: true },
    intentos_fallidos: { type: DataTypes.INTEGER, defaultValue: 0 },
    bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'usuarios',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('USU-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('USU-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `USU-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Usuario;
