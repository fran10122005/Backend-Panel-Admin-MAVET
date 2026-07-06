const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AlumnoRepresentante = sequelize.define(
  'AlumnoRepresentante',
  {
    id_alumno: { type: DataTypes.STRING(15), allowNull: false },
    id_representante: { type: DataTypes.STRING(15), allowNull: false },
    parentesco: { type: DataTypes.STRING(255) },
  },
  {
    tableName: 'alumnos_representantes',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ARE-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ARE-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ARE-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = AlumnoRepresentante;
