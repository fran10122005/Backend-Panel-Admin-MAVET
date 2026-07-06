const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Persona = sequelize.define(
  'Persona',
  {
    id_persona: { type: DataTypes.STRING(15), primaryKey: true },
    cedula: { type: DataTypes.STRING(255), unique: true },
    nombres: { type: DataTypes.STRING(255), allowNull: false },
    apellidos: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(255), allowNull: true },
    fecha_de_nac: { type: DataTypes.DATEONLY, allowNull: true },
    fecha_registro: { type: DataTypes.DATE },
  },
  {
    tableName: 'personas',
    timestamps: false,
    hooks: {
      beforeCreate: async (persona, options) => {
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
      },
    },
  }
);

module.exports = Persona;
