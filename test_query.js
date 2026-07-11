require('dotenv').config();
const { RegistroIngreso, MotivoVisita } = require('./src/models');
const { fn, col } = require('sequelize');
RegistroIngreso.findAll({
  attributes: [
    [col('RegistroIngreso.id_motivo'), 'id_motivo'],
    [fn('COUNT', col('RegistroIngreso.id_ingreso')), 'base_count'],
  ],
  include: [{ model: MotivoVisita, attributes: ['descripcion'] }],
  group: [
    col('RegistroIngreso.id_motivo'),
    col('MotivoVisitum.id_motivo'),
    col('MotivoVisitum.descripcion'),
  ],
  logging: console.log,
})
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
