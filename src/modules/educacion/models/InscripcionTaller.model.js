const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const InscripcionTaller = sequelize.define(
  'InscripcionTaller',
  {
    id_inscripcion: { type: DataTypes.STRING(15), primaryKey: true },
    id_taller: { type: DataTypes.STRING(15) },
    id_alumno: { type: DataTypes.STRING(15) },
    fecha_inscripcion: { type: DataTypes.DATEONLY },
    estado_inscripcion: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'inscripciones_talleres',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ITA-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ITA-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ITA-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = InscripcionTaller;
