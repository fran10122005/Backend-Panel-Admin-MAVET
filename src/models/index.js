const sequelize = require('../config/db');

// Importar modelos Auth
const Role = require('../modules/auth/models/Role.model');
const Usuario = require('../modules/auth/models/Usuario.model');
const BitacoraAuditoria = require('../modules/auth/models/BitacoraAuditoria.model');

// Importar modelos RRHH
const CargoTrabajador = require('../modules/rrhh/models/CargoTrabajador.model');
const Turno = require('../modules/rrhh/models/Turno.model');
const Trabajador = require('../modules/rrhh/models/Trabajador.model');
const AsistenciaQR = require('../modules/rrhh/models/AsistenciaQR.model');

// Importar modelos Obras
const Artista = require('../modules/obras/models/Artista.model');
const TecnicaObra = require('../modules/obras/models/TecnicaObra.model');
const EstadoObra = require('../modules/obras/models/EstadoObra.model');
const Entrega = require('../modules/obras/models/Entrega.model');
const Obra = require('../modules/obras/models/Obra.model');
const HistorialUbicacionObra = require('../modules/obras/models/HistorialUbicacionObra.model');

// Importar modelos Biblioteca
const CategoriaLibro = require('../modules/biblioteca/models/CategoriaLibro.model');
const AutorLibro = require('../modules/biblioteca/models/AutorLibro.model');
const Libro = require('../modules/biblioteca/models/Libro.model');
const ConsultaSala = require('../modules/biblioteca/models/ConsultaSala.model');

// Importar modelos Visitantes
const MotivoVisita = require('../modules/visitantes/models/MotivoVisita.model');
const Visitante = require('../modules/visitantes/models/Visitante.model');
const RegistroIngreso = require('../modules/visitantes/models/RegistroIngreso.model');

// Importar modelos Educacion
const Instructor = require('../modules/educacion/models/Instructor.model');
const Representante = require('../modules/educacion/models/Representante.model');
const Alumno = require('../modules/educacion/models/Alumno.model');
const EspacioMuseo = require('../modules/educacion/models/EspacioMuseo.model');
const Taller = require('../modules/educacion/models/Taller.model');
const InscripcionTaller = require('../modules/educacion/models/InscripcionTaller.model');
const SesionTaller = require('../modules/educacion/models/SesionTaller.model');
const AsistenciaAlumno = require('../modules/educacion/models/AsistenciaAlumno.model');
const SolicitudEspacio = require('../modules/educacion/models/SolicitudEspacio.model');

// ==========================================
// DEFINICIÓN DE ASOCIACIONES (FOREIGN KEYS)
// ==========================================

// --- Usuarios y Sistema ---
Role.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Role, { foreignKey: 'id_rol' });

Trabajador.hasMany(Usuario, { foreignKey: 'id_trabajador' });
Usuario.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

Usuario.hasMany(BitacoraAuditoria, { foreignKey: 'id_usuario' });
BitacoraAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- RRHH ---
CargoTrabajador.hasMany(Trabajador, { foreignKey: 'id_cargo' });
Trabajador.belongsTo(CargoTrabajador, { foreignKey: 'id_cargo' });

// trabajador_turnos (Many-to-Many)
Trabajador.belongsToMany(Turno, { through: 'trabajador_turnos', foreignKey: 'id_trabajador', otherKey: 'id_turno', timestamps: false });
Turno.belongsToMany(Trabajador, { through: 'trabajador_turnos', foreignKey: 'id_turno', otherKey: 'id_trabajador', timestamps: false });

Trabajador.hasMany(AsistenciaQR, { foreignKey: 'id_trabajador' });
AsistenciaQR.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

// --- Obras ---
Entrega.hasMany(Obra, { foreignKey: 'id_entrega' });
Obra.belongsTo(Entrega, { foreignKey: 'id_entrega' });

Artista.hasMany(Obra, { foreignKey: 'id_artista' });
Obra.belongsTo(Artista, { foreignKey: 'id_artista' });

TecnicaObra.hasMany(Obra, { foreignKey: 'id_tecnica' });
Obra.belongsTo(TecnicaObra, { foreignKey: 'id_tecnica' });

EstadoObra.hasMany(Obra, { foreignKey: 'id_estado_actual' });
Obra.belongsTo(EstadoObra, { foreignKey: 'id_estado_actual' });

Obra.hasMany(HistorialUbicacionObra, { foreignKey: 'id_obra' });
HistorialUbicacionObra.belongsTo(Obra, { foreignKey: 'id_obra' });

Usuario.hasMany(HistorialUbicacionObra, { foreignKey: 'id_usuario' });
HistorialUbicacionObra.belongsTo(Usuario, { foreignKey: 'id_usuario' });

EstadoObra.hasMany(HistorialUbicacionObra, { foreignKey: 'id_estado_anterior', as: 'EstadoAnterior' });
HistorialUbicacionObra.belongsTo(EstadoObra, { foreignKey: 'id_estado_anterior', as: 'EstadoAnterior' });

EstadoObra.hasMany(HistorialUbicacionObra, { foreignKey: 'id_estado_nuevo', as: 'EstadoNuevo' });
HistorialUbicacionObra.belongsTo(EstadoObra, { foreignKey: 'id_estado_nuevo', as: 'EstadoNuevo' });

// --- Biblioteca ---
CategoriaLibro.hasMany(Libro, { foreignKey: 'id_categoria' });
Libro.belongsTo(CategoriaLibro, { foreignKey: 'id_categoria' });

Libro.hasMany(ConsultaSala, { foreignKey: 'id_libro' });
ConsultaSala.belongsTo(Libro, { foreignKey: 'id_libro' });

Visitante.hasMany(ConsultaSala, { foreignKey: 'id_visitante' });
ConsultaSala.belongsTo(Visitante, { foreignKey: 'id_visitante' });

// libro_autores (Many-to-Many)
Libro.belongsToMany(AutorLibro, { through: 'libro_autores', foreignKey: 'id_libro', otherKey: 'id_autor', timestamps: false });
AutorLibro.belongsToMany(Libro, { through: 'libro_autores', foreignKey: 'id_autor', otherKey: 'id_libro', timestamps: false });

// --- Visitantes ---
Visitante.hasMany(RegistroIngreso, { foreignKey: 'id_visitante' });
RegistroIngreso.belongsTo(Visitante, { foreignKey: 'id_visitante' });

MotivoVisita.hasMany(RegistroIngreso, { foreignKey: 'id_motivo' });
RegistroIngreso.belongsTo(MotivoVisita, { foreignKey: 'id_motivo' });

Taller.hasMany(RegistroIngreso, { foreignKey: 'id_taller' });
RegistroIngreso.belongsTo(Taller, { foreignKey: 'id_taller' });

// --- Educación y Talleres ---
Instructor.hasMany(Taller, { foreignKey: 'id_instructor' });
Taller.belongsTo(Instructor, { foreignKey: 'id_instructor' });

EspacioMuseo.hasMany(Taller, { foreignKey: 'id_espacio' });
Taller.belongsTo(EspacioMuseo, { foreignKey: 'id_espacio' });

Representante.hasMany(Alumno, { foreignKey: 'id_representante' });
Alumno.belongsTo(Representante, { foreignKey: 'id_representante' });

Taller.hasMany(InscripcionTaller, { foreignKey: 'id_taller' });
InscripcionTaller.belongsTo(Taller, { foreignKey: 'id_taller' });

Alumno.hasMany(InscripcionTaller, { foreignKey: 'id_alumno' });
InscripcionTaller.belongsTo(Alumno, { foreignKey: 'id_alumno' });

Taller.hasMany(SesionTaller, { foreignKey: 'id_taller' });
SesionTaller.belongsTo(Taller, { foreignKey: 'id_taller' });

SesionTaller.hasMany(AsistenciaAlumno, { foreignKey: 'id_sesion' });
AsistenciaAlumno.belongsTo(SesionTaller, { foreignKey: 'id_sesion' });

Alumno.hasMany(AsistenciaAlumno, { foreignKey: 'id_alumno' });
AsistenciaAlumno.belongsTo(Alumno, { foreignKey: 'id_alumno' });

// --- Espacios ---
EspacioMuseo.hasMany(SolicitudEspacio, { foreignKey: 'id_espacio' });
SolicitudEspacio.belongsTo(EspacioMuseo, { foreignKey: 'id_espacio' });

Usuario.hasMany(SolicitudEspacio, { foreignKey: 'id_usuario_aprobador' });
SolicitudEspacio.belongsTo(Usuario, { foreignKey: 'id_usuario_aprobador' });

module.exports = {
  sequelize,
  Role, Usuario, BitacoraAuditoria,
  CargoTrabajador, Turno, Trabajador, AsistenciaQR,
  Artista, TecnicaObra, EstadoObra, Entrega, Obra, HistorialUbicacionObra,
  CategoriaLibro, AutorLibro, Libro, ConsultaSala,
  MotivoVisita, Visitante, RegistroIngreso,
  Instructor, Representante, Alumno, EspacioMuseo, Taller, InscripcionTaller, SesionTaller, AsistenciaAlumno, SolicitudEspacio
};
