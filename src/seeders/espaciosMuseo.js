const { EspacioMuseo } = require('../models');

const espaciosAGregar = [
  { nombre: 'Auditorio', capacidad: '100', descripcion: 'Auditorio principal del museo' },
  { nombre: 'Sala 1', capacidad: '50', descripcion: 'Sala de exhibición 1' },
  { nombre: 'Sala 2', capacidad: '50', descripcion: 'Sala de exhibición 2' },
  { nombre: 'Sala 3', capacidad: '50', descripcion: 'Sala de exhibición 3' },
  { nombre: 'Sala 4', capacidad: '50', descripcion: 'Sala de exhibición 4' },
  { nombre: 'Sala 5', capacidad: '50', descripcion: 'Sala de exhibición 5' },
  { nombre: 'Otro', capacidad: '0', descripcion: 'Otro espacio no contemplado' },
];

const seedEspaciosMuseo = async () => {
  try {
    for (const espacio of espaciosAGregar) {
      const existe = await EspacioMuseo.findOne({ where: { nombre: espacio.nombre } });
      if (!existe) {
        await EspacioMuseo.create(espacio);
        console.log(`Espacio "${espacio.nombre}" creado.`);
      } else {
        console.log(`Espacio "${espacio.nombre}" ya existe (id=${existe.id_espacio}).`);
      }
    }
    console.log('Seed de espacios de museo completado.');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed de espacios:', error);
    process.exit(1);
  }
};

seedEspaciosMuseo();
