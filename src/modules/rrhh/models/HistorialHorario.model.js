const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const HistorialHorario = sequelize.define(
  'HistorialHorario',
  {
    id_historial: { type: DataTypes.STRING(15), primaryKey: true },
    id_trabajador: { type: DataTypes.STRING(15), allowNull: false },
    horas_anteriores: { type: DataTypes.DECIMAL },
    horas_nuevas: { type: DataTypes.DECIMAL, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    id_usuario_modifica: { type: DataTypes.STRING(15) },
    fecha_cambio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'historial_horario',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('HHI-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('HHI-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `HHI-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = HistorialHorario;
