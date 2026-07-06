const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const BitacoraAuditoria = sequelize.define(
  'BitacoraAuditoria',
  {
    id_auditoria: { type: DataTypes.STRING(15), primaryKey: true },
    id_usuario: { type: DataTypes.STRING(15) },
    operacion: { type: DataTypes.STRING(255) },
    tabla_afectada: { type: DataTypes.STRING(255) },
    id_registro_afectado: { type: DataTypes.STRING(15) },
    fecha_accion: { type: DataTypes.DATE },
    valores_anteriores: { type: DataTypes.JSON },
    valores_nuevos: { type: DataTypes.JSON },
  },
  {
    tableName: 'bitacora_auditoria',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('BAU-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('BAU-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `BAU-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: false,
  }
);

module.exports = BitacoraAuditoria;
