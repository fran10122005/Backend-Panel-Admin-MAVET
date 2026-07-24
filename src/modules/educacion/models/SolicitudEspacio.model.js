const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const SolicitudEspacio = sequelize.define(
  'SolicitudEspacio',
  {
    id_solicitud: { type: DataTypes.STRING(15), primaryKey: true },
    numero_expediente: { type: DataTypes.STRING(30), unique: true },
    codigo_reserva: { type: DataTypes.STRING(255) },
    id_espacio: { type: DataTypes.STRING(15), allowNull: false },
    id_persona: { type: DataTypes.STRING(15), allowNull: false },
    institucion: { type: DataTypes.STRING(255) },
    fecha_uso: { type: DataTypes.DATEONLY },
    hora_inicio: { type: DataTypes.TIME },
    hora_fin: { type: DataTypes.TIME },
    motivo: { type: DataTypes.TEXT },
    estado: { type: DataTypes.STRING(255) },
    mostrar_en_web: { type: DataTypes.BOOLEAN, defaultValue: false },
    descripcion_web: { type: DataTypes.TEXT },

    correo_electronico: { type: DataTypes.STRING(255) },
    recursos_solicitados: { type: DataTypes.JSON },
    nombre_responsable: { type: DataTypes.STRING(255) },
    fecha_creacion: { type: DataTypes.DATE },
    fecha_modificacion: { type: DataTypes.DATE },
  },
  {
    tableName: 'solicitudes_espacios',
    hooks: {
      beforeCreate: async (instance, options) => {
        const pkField = instance.constructor.primaryKeyAttribute;
        if (!pkField || (pkField === 'id' && instance.rawAttributes.id.type.key !== 'STRING'))
          return;

        await sequelize.query(`SELECT pg_advisory_xact_lock(123456)`, {
          transaction: options.transaction,
        });

        const [result] = await sequelize.query(
          `SELECT COALESCE(MAX(CAST(REPLACE(id_solicitud, 'SES-', '') AS INTEGER)), 0) + 1 AS next_num FROM solicitudes_espacios`,
          { transaction: options.transaction, raw: true }
        );
        const newNumber = parseInt(result[0]?.next_num, 10) || 1;

        const padded = String(newNumber).padStart(5, '0');
        instance[pkField] = `SES-${padded}`;
        instance.codigo_reserva = `RES-${padded}`;
        const year = new Date().getFullYear();
        instance.numero_expediente = `EXP-AUD-${year}-${padded}`;
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
