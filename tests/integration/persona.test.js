const request = require('supertest');
const app = require('../../src/server');
const jwt = require('jsonwebtoken');
const { sequelize, Persona, Alumno, Representante, AlumnoRepresentante, Role, Usuario } = require('../../src/models');

let token;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const role = await Role.create({ nombre_rol: 'Admin', permisos: 'all' });
  const usuario = await Usuario.create({ correo: 'admin@test.com', password: '123', id_rol: role.id_rol });
  token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET || 'secret');

  // Persona 1: Adulto
  const adulto = await Persona.create({
    cedula: 'V-10000000',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '0414-1111111',
    fecha_de_nac: '1980-01-01'
  });

  const rep = await Representante.create({ id_persona: adulto.id_persona });

  // Persona 2: Menor con cédula derivada y edad 10 (require_cedula_update debe ser true)
  const menorAdulto = await Persona.create({
    cedula: 'V-10000000-1',
    nombres: 'Pedrito',
    apellidos: 'Pérez',
    telefono: '',
    fecha_de_nac: new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]
  });

  const al1 = await Alumno.create({ id_persona: menorAdulto.id_persona });
  await AlumnoRepresentante.create({ id_alumno: al1.id_alumno, id_representante: rep.id_representante });

  // Persona 3: Menor con cédula derivada y edad 5 (require_cedula_update debe ser false)
  const nino = await Persona.create({
    cedula: 'V-10000000-2',
    nombres: 'Maria',
    apellidos: 'Pérez',
    telefono: '',
    fecha_de_nac: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0]
  });

  const al2 = await Alumno.create({ id_persona: nino.id_persona });
  await AlumnoRepresentante.create({ id_alumno: al2.id_alumno, id_representante: rep.id_representante });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Persona Endpoints', () => {
  it('debería buscar por nombre y devolver resultados usando OR', async () => {
    const res = await request(app).get('/api/personas/buscar?q=Juan').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].nombres).toBe('Juan');
  });

  it('debería devolver require_cedula_update: true para menores con cédula derivada >= 9 años', async () => {
    const res = await request(app).get('/api/personas/buscar?q=Pedrito').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data[0].require_cedula_update).toBe(true);
    expect(res.body.data[0].representante).toBeDefined();
    expect(res.body.data[0].representante.nombres).toBe('Juan');
  });

  it('debería devolver require_cedula_update: false para menores con cédula derivada < 9 años', async () => {
    const res = await request(app).get('/api/personas/buscar?q=Maria').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data[0].require_cedula_update).toBe(false);
  });
});
