const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const AppError = require('../../../utils/AppError');
const { normalizeCedula } = require('../../../utils/cedula');

const Persona = sequelize.define(
  'Persona',
  {
    id_persona: { type: DataTypes.STRING(15), primaryKey: true },
    cedula: { type: DataTypes.STRING(255), unique: true },
    nombres: { type: DataTypes.STRING(255), allowNull: false },
    apellidos: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(255), allowNull: true },
    fecha_de_nac: { type: DataTypes.DATEONLY, allowNull: true },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'personas',
    timestamps: false,
    hooks: {
      beforeCreate: async (persona, options) => {
        if (persona.cedula) {
          persona.cedula = normalizeCedula(persona.cedula);

          const existing = await Persona.findOne({
            where: { cedula: persona.cedula },
            transaction: options.transaction,
          });
          if (existing) {
            throw new AppError('La cédula ya se encuentra registrada en el sistema', 400);
          }
        }

        const lastPersona = await Persona.findOne({
          order: [['id_persona', 'DESC']],
          transaction: options.transaction,
          raw: true,
        });

        let newNumber = 1;
        if (lastPersona && lastPersona.id_persona && lastPersona.id_persona.startsWith('PER-')) {
          const lastNumber = parseInt(lastPersona.id_persona.replace('PER-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        persona.id_persona = `PER-${String(newNumber).padStart(5, '0')}`;
        if (!persona.fecha_registro) {
          persona.fecha_registro = new Date();
        }

        if (persona.telefono) {
          const digits = persona.telefono.replace(/\D/g, '');
          if (digits.length >= 5) {
            persona.telefono = `${digits.slice(0, 4)}-${digits.slice(4)}`;
          } else {
            persona.telefono = digits;
          }
        }
      },
      beforeUpdate: async (persona, options) => {
        if (persona.changed('cedula') && persona.cedula) {
          persona.cedula = normalizeCedula(persona.cedula);

          const { Op } = require('sequelize');
          const existing = await Persona.findOne({
            where: {
              cedula: persona.cedula,
              id_persona: { [Op.ne]: persona.id_persona },
            },
            transaction: options.transaction,
          });
          if (existing) {
            throw new AppError('La cédula ya se encuentra registrada en el sistema', 400);
          }
        }

        if (persona.telefono) {
          const digits = persona.telefono.replace(/\D/g, '');
          if (digits.length >= 5) {
            persona.telefono = `${digits.slice(0, 4)}-${digits.slice(4)}`;
          } else {
            persona.telefono = digits;
          }
        }
      },
    },
  }
);

module.exports = Persona;
