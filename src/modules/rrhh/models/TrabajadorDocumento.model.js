const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const AppError = require('../../../utils/AppError');

const TrabajadorDocumento = sequelize.define(
  'TrabajadorDocumento',
  {
    id_documento: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    id_trabajador: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    tipo_documento: {
      type: DataTypes.ENUM('contrato', 'cv', 'cedula', 'certificado', 'otro'),
      allowNull: false,
    },
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
    },
    tamano_archivo: {
      type: DataTypes.INTEGER,
    },
    notas: {
      type: DataTypes.TEXT,
    },
    fecha_subida: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'trabajador_documentos',
    hooks: {
      beforeCreate: async (instance, options) => {
        // Generar ID de documento (TDOC-XXXXX)
        const pkField = instance.constructor.primaryKeyAttribute;
        if (!pkField || (pkField === 'id' && instance.rawAttributes.id.type.key !== 'STRING'))
          return;

        const lastRecord = await instance.constructor.findOne({
          order: [[pkField, 'DESC']],
          transaction: options.transaction,
          raw: true,
          paranoid: false,
        });

        let newNumber = 1;
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TDOC-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TDOC-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TDOC-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'fecha_subida',
    updatedAt: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = TrabajadorDocumento;
