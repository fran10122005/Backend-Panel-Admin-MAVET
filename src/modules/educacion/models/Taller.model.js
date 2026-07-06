const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Taller = sequelize.define(
  'Taller',
  {
    id_taller: { type: DataTypes.STRING(15), primaryKey: true },
    nombre_curso: { type: DataTypes.STRING(255) },
    inventario_id: { type: DataTypes.STRING(15) },
    id_instructor: { type: DataTypes.STRING(15) },
    id_espacio: { type: DataTypes.STRING(15) },
    sesiones: { type: DataTypes.STRING(15) },
    fecha: { type: DataTypes.DATEONLY },
    hora_inicio: { type: DataTypes.TIME },
    hora_fin: { type: DataTypes.TIME },
    horas_totales: { type: DataTypes.STRING(15) },
    cupo_minimo: { type: DataTypes.STRING(15) },
    cupo_maximo: { type: DataTypes.STRING(15) },

    estado: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'talleres',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TAL-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TAL-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TAL-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Taller;
