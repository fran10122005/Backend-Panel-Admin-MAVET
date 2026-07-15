const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const MovimientoObra = sequelize.define(
  'MovimientoObra',
  {
    id_movimiento: { type: DataTypes.STRING(15), primaryKey: true },
    id_obra: { type: DataTypes.STRING(15), allowNull: false },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    ubicacion_origen: { type: DataTypes.STRING(255), allowNull: true },
    ubicacion_destino: { type: DataTypes.STRING(255), allowNull: true },
    responsable: { type: DataTypes.STRING(255), allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'movimientos_obras',
    hooks: {
      beforeCreate: async (instance, options) => {
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('MOV-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('MOV-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `MOV-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = MovimientoObra;
