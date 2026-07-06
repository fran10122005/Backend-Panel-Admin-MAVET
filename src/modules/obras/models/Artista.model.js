const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');

const Artista = sequelize.define(
  'Artista',
  {
    id_artista: { type: DataTypes.STRING(15), primaryKey: true },
    nombres: { type: DataTypes.STRING(100) },
    apellidos: { type: DataTypes.STRING(100) },
    ci: { type: DataTypes.STRING(20) },
    fecha_nacimiento: { type: DataTypes.DATEONLY },
    telefono: { type: DataTypes.STRING(20) },
    correo: { type: DataTypes.STRING(255) },
    direccion: { type: DataTypes.TEXT },
    nacionalidad: { type: DataTypes.STRING(50) },
  },
  {
    tableName: 'artistas',
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
        if (lastRecord && lastRecord[pkField] && lastRecord[pkField].startsWith('ART-')) {
          const lastNumber = parseInt(lastRecord[pkField].replace('ART-', ''), 10);
          if (!isNaN(lastNumber)) {
            newNumber = lastNumber + 1;
          }
        }

        instance[pkField] = `ART-${String(newNumber).padStart(5, '0')}`;
      },
    },
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

module.exports = Artista;
