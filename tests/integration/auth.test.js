const request = require('supertest');
const app = require('../../src/server'); 
const { sequelize, Role, Trabajador, CargoTrabajador } = require('../../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true }); 

  // Seed datos básicos
  await Role.create({
    nombre_rol: 'Admin',
    descripcion: 'Administrador del sistema',
    permisos: 'all'
  });

  const cargo = await CargoTrabajador.create({
    nombre_cargo: 'Gerente',
    descripcion: 'Gerente general'
  });

  await Trabajador.create({
    cedula: 'V-12345678',
    nombres: 'Test',
    apellidos: 'User',
    telefono: '04121234567',
    correo_personal: 'personal@test.com',
    estado: 'Activo',
    id_cargo: cargo.id_cargo
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Endpoints', () => {
  let token;

  it('debería registrar un nuevo usuario y devolver un token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        correo: 'admin@mavet.com',
        password: 'password123',
        id_rol: 1,
        id_trabajador: 1
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.usuario.correo).toBe('admin@mavet.com');
  });

  it('no debería registrar un usuario con un correo existente', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        correo: 'admin@mavet.com',
        password: 'password123',
        id_rol: 1,
        id_trabajador: 1
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('ya está registrado');
  });

  it('debería iniciar sesión correctamente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'admin@mavet.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('token');
    token = res.body.data.token; 
  });

  it('no debería iniciar sesión con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'admin@mavet.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toContain('incorrectos');
  });

  it('debería acceder a la ruta protegida /me usando el token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.usuario.id_usuario).toBeDefined(); 
  });

  it('debería denegar acceso a /me sin token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
  });
});
