const request = require('supertest');
const app = require('../../src/server');
const jwt = require('jsonwebtoken');
const { sequelize, CategoriaLibro, AutorLibro, Libro, ConsultaSala, Role, Usuario } = require('../../src/models');

let token;

let consultaId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const role = await Role.create({ nombre_rol: 'Admin', permisos: 'all' });
  const usuario = await Usuario.create({ correo: 'admin@test.com', password: '123', id_rol: role.id_rol });
  token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET || 'secret');

  const categoria = await CategoriaLibro.create({ nombre_categoria: 'Arte' });
  const autor = await AutorLibro.create({ nombre_autor: 'Leonardo', apellido_autor: 'Da Vinci' });

  const libro = await Libro.create({
    titulo: 'El Código Da Vinci',
    id_categoria: categoria.id_categoria,
    cantidad_disponible: 5,
    estado: 'Aprobado'
  });

  const consulta = await ConsultaSala.create({
    id_libro: libro.id_libro,
    mesa: 'Mesa 1',
    estado: 'Pendiente'
  });

  consultaId = consulta.id_consulta;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Biblioteca ConsultaSala Endpoints', () => {
  it('debería actualizar el estado de una consulta (devolución minimalista)', async () => {
    const res = await request(app)
      .put(`/api/biblioteca/consultas-sala/${consultaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'Devuelto'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('actualizada');
    
    // Verificar en BD que el estado cambió
    const consultaDB = await ConsultaSala.findByPk(consultaId);
    expect(consultaDB.estado).toBe('Devuelto');
    
    // NOTA: No probamos el stock aquí porque eso lo hace el trigger en la DB real.
  });
});
