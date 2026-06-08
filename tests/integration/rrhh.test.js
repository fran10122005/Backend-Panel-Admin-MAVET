const request = require('supertest');
const app = require('../../src/server');
const jwt = require('jsonwebtoken');
const { sequelize, CargoTrabajador, Trabajador, Role, Usuario } = require('../../src/models');

let token;

let cargoId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const role = await Role.create({ nombre_rol: 'Admin', permisos: 'all' });
  const usuario = await Usuario.create({ correo: 'admin@test.com', password: '123', id_rol: role.id_rol });
  token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET || 'secret');

  const cargo = await CargoTrabajador.create({ nombre_cargo: 'Mantenimiento' });
  cargoId = cargo.id_cargo;
});

afterAll(async () => {
  await sequelize.close();
});

describe('RRHH Trabajadores Endpoints', () => {
  it('debería permitir la creación de un trabajador con id_usuario null', async () => {
    const res = await request(app)
      .post('/api/rrhh/trabajadores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cedula: 'V-40000000',
        nombres: 'Personal',
        apellidos: 'Operativo',
        id_cargo: cargoId,
        id_usuario: null
      });

    expect([200, 201]).toContain(res.statusCode);
    
    // Validar en la BD que se insertó correctamente
    const trabajadorDB = await Trabajador.findOne({ where: { cedula: 'V-40000000' } });
    expect(trabajadorDB).not.toBeNull();
    expect(trabajadorDB.id_usuario).toBeNull();
  });
});
