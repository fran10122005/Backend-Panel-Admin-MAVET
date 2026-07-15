const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const BitacoraAuditoria = sequelize.define(
  'BitacoraAuditoria',
  {
    id_auditoria: { type: DataTypes.STRING(15), primaryKey: true },
    id_usuario: { type: DataTypes.STRING(15), allowNull: true },
    correo: { type: DataTypes.STRING(255), allowNull: true },
    tipo: {
      type: DataTypes.ENUM(
        'login',
        'logout',
        'create',
        'update',
        'delete',
        'restore',
        'export',
        'error'
      ),
      allowNull: false,
    },
    detalle: { type: DataTypes.TEXT, allowNull: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'bitacora_auditoria',
    timestamps: false,
    hooks: {
      beforeCreate: async (instance) => {
        const lastRecord = await instance.constructor.findOne({
          order: [['id_auditoria', 'DESC']],
          raw: true,
          paranoid: false,
        });
        let newNumber = 1;
        if (lastRecord && lastRecord.id_auditoria && lastRecord.id_auditoria.startsWith('AUD-')) {
          const lastNumber = parseInt(lastRecord.id_auditoria.replace('AUD-', ''), 10);
          if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        instance.id_auditoria = `AUD-${String(newNumber).padStart(5, '0')}`;
      },
    },
  }
);

module.exports = BitacoraAuditoria;
