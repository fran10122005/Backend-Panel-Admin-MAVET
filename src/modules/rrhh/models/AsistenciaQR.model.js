const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const AsistenciaQR = sequelize.define(
  'AsistenciaQR',
  {
    id_asistencia: { type: DataTypes.STRING(15), primaryKey: true },
    id_trabajador: { type: DataTypes.STRING(15), allowNull: false },
    fecha: { type: DataTypes.DATEONLY },
    entrada_manana: { type: DataTypes.DATE },
    salida_manana: { type: DataTypes.DATE },
    entrada_tarde: { type: DataTypes.DATE },
    salida_tarde: { type: DataTypes.DATE },
    horas_cumplidas_dia: { type: DataTypes.DECIMAL },
    horas_justificadas: { type: DataTypes.DECIMAL },
    observaciones: { type: DataTypes.TEXT },
  },
  {
    tableName: 'asistencias_qr',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('AQR-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('AQR-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `AQR-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = AsistenciaQR;
