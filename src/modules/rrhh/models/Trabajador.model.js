const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');

const Trabajador = sequelize.define(
  'Trabajador',
  {
    id_trabajador: { type: DataTypes.STRING(15), primaryKey: true },
    id_usuario: { type: DataTypes.STRING(15), allowNull: true },
    cedula: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    nombres: { type: DataTypes.STRING(255), allowNull: false },
    apellidos: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: false },
    correo_personal: { type: DataTypes.STRING(255), allowNull: false },
    id_cargo: { type: DataTypes.STRING(15), allowNull: false },
    horas_semanales: { type: DataTypes.DECIMAL, allowNull: false },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
    direccion: { type: DataTypes.TEXT, allowNull: false },
    fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: false },
    qr_uuid: { type: DataTypes.STRING(255), unique: true },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
    foto_url: { type: DataTypes.STRING(500), allowNull: true },
    documento_minuta_url: { type: DataTypes.STRING(500), allowNull: true },
    documento_minuta_nombre: { type: DataTypes.STRING(255), allowNull: true },
    pin_hash: { type: DataTypes.STRING(255), allowNull: true },
    pin_intentos_fallidos: { type: DataTypes.INTEGER, defaultValue: 0 },
    pin_bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
    descriptor_facial: { type: DataTypes.TEXT, allowNull: true },
    descriptores_faciales: { type: DataTypes.JSONB, allowNull: true },
    usarFacial: { type: DataTypes.BOOLEAN, defaultValue: false },
    consentimientoFacial: { type: DataTypes.BOOLEAN, defaultValue: false },
    fechaConsentimiento: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: 'trabajadores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: true,
    deletedAt: 'deleted_at',
    hooks: {
      beforeCreate: async (instance, options) => {
        if (instance.cedula) {
          instance.cedula = normalizeCedula(instance.cedula);

          const existing = await Trabajador.findOne({
            where: { cedula: instance.cedula },
            transaction: options.transaction,
            paranoid: false,
          });
          if (existing) {
            throw new AppError('La cédula del trabajador ya se encuentra registrada', 400);
          }
        }

        // Generar UUID para QR si no existe
        if (!instance.qr_uuid) {
          const crypto = require('crypto');
          instance.qr_uuid = crypto.randomUUID();
        }

        // Generar ID de trabajador (TRB-XXXXX)
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TRB-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TRB-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `TRB-${String(newNumber).padStart(5, '0')}`;
      },
      beforeUpdate: async (instance, options) => {
        if (instance.changed('cedula') && instance.cedula) {
          instance.cedula = normalizeCedula(instance.cedula);

          const { Op } = require('sequelize');
          const existing = await Trabajador.findOne({
            where: {
              cedula: instance.cedula,
              id_trabajador: { [Op.ne]: instance.id_trabajador },
            },
            transaction: options.transaction,
            paranoid: false,
          });
          if (existing) {
            throw new AppError('La cédula del trabajador ya se encuentra registrada', 400);
          }
        }
      },
    },
  }
);

module.exports = Trabajador;
