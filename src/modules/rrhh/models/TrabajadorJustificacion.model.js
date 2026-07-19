const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const AppError = require('../../../utils/AppError');

const TrabajadorJustificacion = sequelize.define(
  'TrabajadorJustificacion',
  {
    id_justificacion: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    id_trabajador: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        'falta_dia_completo',
        'falta_parcial',
        'llegada_tardia',
        'salida_anticipada'
      ),
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Para faltas parciales, tardanzas, salidas anticipadas',
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    motivo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    archivo_ruta: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    archivo_nombre: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    archivo_mime: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    archivo_tamano: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
      defaultValue: 'pendiente',
    },
    revisada_por: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    fecha_revision: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    observaciones_revision: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'trabajador_justificaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('TJU-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('TJU-', ''), 10);
          if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        instance[pkField] = `TJU-${String(newNumber).padStart(5, '0')}`;
      },
    },
  }
);

module.exports = TrabajadorJustificacion;
