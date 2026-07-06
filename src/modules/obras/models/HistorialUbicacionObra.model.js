const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const HistorialUbicacionObra = sequelize.define(
  'HistorialUbicacionObra',
  {
    id_movimiento: { type: DataTypes.STRING(15), primaryKey: true },
    id_obra: { type: DataTypes.STRING(15) },
    id_usuario: { type: DataTypes.STRING(15) },
    id_estado_anterior: { type: DataTypes.STRING(15) },
    id_estado_nuevo: { type: DataTypes.STRING(15) },
    observaciones: { type: DataTypes.TEXT },
    fecha_movimiento: { type: DataTypes.DATE },
  },
  {
    tableName: 'historial_ubicaciones_obras',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('HUO-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('HUO-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `HUO-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = HistorialUbicacionObra;
