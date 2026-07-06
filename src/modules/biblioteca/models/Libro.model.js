const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Libro = sequelize.define(
  'Libro',
  {
    id_libro: { type: DataTypes.STRING(15), primaryKey: true },
    unidad: { type: DataTypes.STRING(255) }, // Código de unidad/catalogación
    cuota: { type: DataTypes.STRING(255) }, // Número largo de catalogación
    titulo: { type: DataTypes.STRING(255) },
    ano_libro: { type: DataTypes.STRING(15) }, // Año de publicación (solo el número)
    id_categoria: { type: DataTypes.STRING(15) },
    cantidad_total: { type: DataTypes.INTEGER, defaultValue: 1 },
    cantidad_disponible: { type: DataTypes.INTEGER, defaultValue: 1 },
    estado: { type: DataTypes.STRING(255) },
    estante: { type: DataTypes.STRING(255) }, // Ubicación física en la biblioteca
    fecha_ingreso: { type: DataTypes.DATEONLY },
  },
  {
    tableName: 'libros',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('LIB-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('LIB-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `LIB-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Libro;
