const request = require('supertest');
const app = require('../../src/server');
const { sequelize } = require('../../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Roles Endpoints', () => {
  let rolId;

  it('debería crear un nuevo rol', async () => {
    const res = await request(app)
      .post('/api/auth/roles')
      .send({
        nombre_rol: 'Supervisor',
        descripcion: 'Supervisor del museo',
        permisos: 'read,write'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('id_rol');
    rolId = res.body.data.id_rol;
  });

  it('debería listar todos los roles', async () => {
    const res = await request(app)
      .get('/api/auth/roles');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('debería obtener un rol por ID', async () => {
    const res = await request(app)
      .get(`/api/auth/roles/${rolId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.nombre_rol).toBe('Supervisor');
  });

  it('debería actualizar un rol', async () => {
    const res = await request(app)
      .put(`/api/auth/roles/${rolId}`)
      .send({
        nombre_rol: 'Supervisor Editado'
      });

    expect(res.statusCode).toEqual(200);
  });

  it('debería eliminar un rol', async () => {
    const res = await request(app)
      .delete(`/api/auth/roles/${rolId}`);

    expect(res.statusCode).toEqual(200);
  });
});
