const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Obra = sequelize.define(
  'Obra',
  {
    id_obra: { type: DataTypes.STRING(15), primaryKey: true },
    id_entrega: { type: DataTypes.STRING(15) },
    codigo_inventario: { type: DataTypes.STRING(255), unique: true },
    titulo: { type: DataTypes.STRING(255) },
    id_artista: { type: DataTypes.STRING(15) },
    anio: { type: DataTypes.STRING(15) },
    medidas: { type: DataTypes.STRING(255) },
    peso: { type: DataTypes.NUMERIC },
    id_tecnica: { type: DataTypes.STRING(15) },
    imagen_url: { type: DataTypes.STRING(500) },
    tipo_ingreso: { type: DataTypes.STRING(255) },
    id_estado_actual: { type: DataTypes.STRING(15) },
    ubicacion_actual: { type: DataTypes.STRING(255) },
    piezas: { type: DataTypes.STRING(15) },
    modalidad: { type: DataTypes.STRING(255) },
    id_categoria_obra: { type: DataTypes.STRING(15) },
    descripcion: { type: DataTypes.TEXT },
  },
  {
    tableName: 'obras',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('OBR-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('OBR-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `OBR-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Obra;
