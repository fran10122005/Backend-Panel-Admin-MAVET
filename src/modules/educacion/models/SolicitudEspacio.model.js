const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const SolicitudEspacio = sequelize.define(
  'SolicitudEspacio',
  {
    id_solicitud: { type: DataTypes.STRING(15), primaryKey: true },
    codigo_reserva: { type: DataTypes.STRING(255) },
    id_espacio: { type: DataTypes.STRING(15), allowNull: false },
    id_persona: { type: DataTypes.STRING(15), allowNull: false },
    institucion: { type: DataTypes.STRING(255) },
    fecha_uso: { type: DataTypes.DATEONLY },
    hora_inicio: { type: DataTypes.TIME },
    hora_fin: { type: DataTypes.TIME },
    motivo: { type: DataTypes.TEXT },
    estado: { type: DataTypes.STRING(255) },
    fecha_creacion: { type: DataTypes.DATE },
    fecha_modificacion: { type: DataTypes.DATE },
  },
  {
    tableName: 'solicitudes_espacios',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('SES-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('SES-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `SES-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_modificacion',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = SolicitudEspacio;
