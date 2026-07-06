const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const ImagenWeb = sequelize.define(
  'ImagenWeb',
  {
    id_imagen: { type: DataTypes.STRING(15), primaryKey: true },
    id_obra: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    url: { type: DataTypes.STRING(500), allowNull: false },
    titulo: { type: DataTypes.STRING(255) },
    descripcion: { type: DataTypes.TEXT },
    seccion: { type: DataTypes.STRING(50), defaultValue: 'galeria' },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    orden: { type: DataTypes.STRING(15), defaultValue: 0 },
  },
  {
    tableName: 'imagenes_web',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('IWE-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('IWE-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `IWE-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = ImagenWeb;
