const sequelize = require('../config/db');

// Importar modelos Auth
const Role = require('../modules/auth/models/Role.model');

// Importar modelos RRHH
const CargoTrabajador = require('../modules/rrhh/models/CargoTrabajador.model');
const Turno = require('../modules/rrhh/models/Turno.model');
const Trabajador = require('../modules/rrhh/models/Trabajador.model');

// Importar modelos Obras
const Artista = require('../modules/obras/models/Artista.model');
const TecnicaObra = require('../modules/obras/models/TecnicaObra.model');
const EstadoObra = require('../modules/obras/models/EstadoObra.model');
const Entrega = require('../modules/obras/models/Entrega.model');
const Obra = require('../modules/obras/models/Obra.model');

// Importar modelos Biblioteca
const CategoriaLibro = require('../modules/biblioteca/models/CategoriaLibro.model');
const AutorLibro = require('../modules/biblioteca/models/AutorLibro.model');
const Libro = require('../modules/biblioteca/models/Libro.model');

// Importar modelos Visitantes
const MotivoVisita = require('../modules/visitantes/models/MotivoVisita.model');
const Visitante = require('../modules/visitantes/models/Visitante.model');

// Importar modelos Educacion
const Instructor = require('../modules/educacion/models/Instructor.model');
const Representante = require('../modules/educacion/models/Representante.model');
const Alumno = require('../modules/educacion/models/Alumno.model');
const EspacioMuseo = require('../modules/educacion/models/EspacioMuseo.model');
const Taller = require('../modules/educacion/models/Taller.model');

// ==========================================
// DEFINICIÓN DE ASOCIACIONES (FOREIGN KEYS)
// ==========================================

// RRHH
CargoTrabajador.hasMany(Trabajador, { foreignKey: 'id_cargo' });
Trabajador.belongsTo(CargoTrabajador, { foreignKey: 'id_cargo' });

// Obras
Entrega.hasMany(Obra, { foreignKey: 'id_entrega' });
Obra.belongsTo(Entrega, { foreignKey: 'id_entrega' });

Artista.hasMany(Obra, { foreignKey: 'id_artista' });
Obra.belongsTo(Artista, { foreignKey: 'id_artista' });

TecnicaObra.hasMany(Obra, { foreignKey: 'id_tecnica' });
Obra.belongsTo(TecnicaObra, { foreignKey: 'id_tecnica' });

EstadoObra.hasMany(Obra, { foreignKey: 'id_estado_actual' });
Obra.belongsTo(EstadoObra, { foreignKey: 'id_estado_actual' });

// Biblioteca
CategoriaLibro.hasMany(Libro, { foreignKey: 'id_categoria' });
Libro.belongsTo(CategoriaLibro, { foreignKey: 'id_categoria' });

// Educación y Talleres
Instructor.hasMany(Taller, { foreignKey: 'id_instructor' });
Taller.belongsTo(Instructor, { foreignKey: 'id_instructor' });

EspacioMuseo.hasMany(Taller, { foreignKey: 'id_espacio' });
Taller.belongsTo(EspacioMuseo, { foreignKey: 'id_espacio' });

Representante.hasMany(Alumno, { foreignKey: 'id_representante' });
Alumno.belongsTo(Representante, { foreignKey: 'id_representante' });

module.exports = {
  sequelize,
  Role,
  CargoTrabajador, Turno, Trabajador,
  Artista, TecnicaObra, EstadoObra, Entrega, Obra,
  CategoriaLibro, AutorLibro, Libro,
  MotivoVisita, Visitante,
  Instructor, Representante, Alumno, EspacioMuseo, Taller
};
