const sequelize = require('../config/db');

// Importar modelos Auth
const Role = require('../modules/auth/models/Role.model');
const Usuario = require('../modules/auth/models/Usuario.model');
const BitacoraAuditoria = require('../modules/auth/models/BitacoraAuditoria.model');

// Importar modelo Maestro Persona
const Persona = require('../modules/personas/models/Persona.model');

// Importar modelos RRHH
const CargoTrabajador = require('../modules/rrhh/models/CargoTrabajador.model');
const Turno = require('../modules/rrhh/models/Turno.model');
const Trabajador = require('../modules/rrhh/models/Trabajador.model');
const AsistenciaQR = require('../modules/rrhh/models/AsistenciaQR.model');
const HistorialHorario = require('../modules/rrhh/models/HistorialHorario.model');
const TrabajadorDocumento = require('../modules/rrhh/models/TrabajadorDocumento.model');
const TrabajadorHorario = require('../modules/rrhh/models/TrabajadorHorario.model');
const TrabajadorJustificacion = require('../modules/rrhh/models/TrabajadorJustificacion.model');

// Importar modelos Obras
const Artista = require('../modules/obras/models/Artista.model');
const TecnicaObra = require('../modules/obras/models/TecnicaObra.model');
const EstadoObra = require('../modules/obras/models/EstadoObra.model');
const CategoriaObra = require('../modules/obras/models/CategoriaObra.model');
const Entrega = require('../modules/obras/models/Entrega.model');
const Obra = require('../modules/obras/models/Obra.model');
const ImagenWeb = require('../modules/obras/models/ImagenWeb.model');
const MovimientoObra = require('../modules/obras/models/MovimientoObra.model');

// Importar modelos Biblioteca
const CategoriaLibro = require('../modules/biblioteca/models/CategoriaLibro.model');
const AutorLibro = require('../modules/biblioteca/models/AutorLibro.model');
const Libro = require('../modules/biblioteca/models/Libro.model');
const ConsultaSala = require('../modules/biblioteca/models/ConsultaSala.model');

// Importar modelos Auditorio
const TipoEvento = require('../modules/auditorio/models/TipoEvento.model');

// Importar modelos Visitantes
const MotivoVisita = require('../modules/visitantes/models/MotivoVisita.model');
const RegistroIngreso = require('../modules/visitantes/models/RegistroIngreso.model');

// Importar modelos Configuracion
const ConfiguracionWeb = require('../modules/config/models/ConfiguracionWeb.model');

// Importar modelos Educacion
const Instructor = require('../modules/educacion/models/Instructor.model');
const Representante = require('../modules/educacion/models/Representante.model');
const Alumno = require('../modules/educacion/models/Alumno.model');
const AlumnoRepresentante = require('../modules/educacion/models/AlumnoRepresentante.model');
const EspacioMuseo = require('../modules/educacion/models/EspacioMuseo.model');
const Taller = require('../modules/educacion/models/Taller.model');
const InscripcionTaller = require('../modules/educacion/models/InscripcionTaller.model');
const SesionTaller = require('../modules/educacion/models/SesionTaller.model');
const AsistenciaAlumno = require('../modules/educacion/models/AsistenciaAlumno.model');
const SolicitudEspacio = require('../modules/educacion/models/SolicitudEspacio.model');
const InventarioTaller = require('../modules/educacion/models/InventarioTaller.model');

// ==========================================
// DEFINICIÓN DE ASOCIACIONES (FOREIGN KEYS)
// ==========================================

// --- Persona (Tabla Maestra) ---
Persona.hasMany(Alumno, { foreignKey: 'id_persona' });
Alumno.belongsTo(Persona, { foreignKey: 'id_persona' });

Persona.hasMany(Instructor, { foreignKey: 'id_persona' });
Instructor.belongsTo(Persona, { foreignKey: 'id_persona' });

Persona.hasMany(Representante, { foreignKey: 'id_persona' });
Representante.belongsTo(Persona, { foreignKey: 'id_persona' });

// --- Usuarios y Sistema ---
Role.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Role, { foreignKey: 'id_rol' });

Usuario.hasOne(Trabajador, { foreignKey: 'id_usuario' });
Trabajador.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- RRHH ---
CargoTrabajador.hasMany(Trabajador, { foreignKey: 'id_cargo' });
Trabajador.belongsTo(CargoTrabajador, { foreignKey: 'id_cargo' });

// trabajador_turnos (Many-to-Many)
Trabajador.belongsToMany(Turno, {
  through: 'trabajador_turnos',
  foreignKey: 'id_trabajador',
  otherKey: 'id_turno',
  timestamps: false,
});
Turno.belongsToMany(Trabajador, {
  through: 'trabajador_turnos',
  foreignKey: 'id_turno',
  otherKey: 'id_trabajador',
  timestamps: false,
});

// Trabajador - Documentos
Trabajador.hasMany(TrabajadorDocumento, { foreignKey: 'id_trabajador' });
TrabajadorDocumento.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

// Trabajador - Horarios
Trabajador.hasMany(TrabajadorHorario, { foreignKey: 'id_trabajador' });
TrabajadorHorario.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

// Trabajador - Justificaciones
Trabajador.hasMany(TrabajadorJustificacion, { foreignKey: 'id_trabajador' });
TrabajadorJustificacion.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

Trabajador.hasMany(AsistenciaQR, { foreignKey: 'id_trabajador' });
AsistenciaQR.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

Trabajador.hasMany(HistorialHorario, { foreignKey: 'id_trabajador' });
HistorialHorario.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

Usuario.hasMany(HistorialHorario, { foreignKey: 'id_usuario_modifica' });
HistorialHorario.belongsTo(Usuario, { foreignKey: 'id_usuario_modifica' });

// --- Obras ---
Entrega.hasMany(Obra, { foreignKey: 'id_entrega' });
Obra.belongsTo(Entrega, { foreignKey: 'id_entrega' });

Artista.hasMany(Obra, { foreignKey: 'id_artista', as: 'Obras' });
Obra.belongsTo(Artista, { foreignKey: 'id_artista', as: 'Artista' });

TecnicaObra.hasMany(Obra, { foreignKey: 'id_tecnica' });
Obra.belongsTo(TecnicaObra, { foreignKey: 'id_tecnica' });

TecnicaObra.belongsTo(CategoriaObra, { foreignKey: 'id_categoria_obra' });
CategoriaObra.hasMany(TecnicaObra, { foreignKey: 'id_categoria_obra' });

EstadoObra.hasMany(Obra, { foreignKey: 'id_estado_actual' });
Obra.belongsTo(EstadoObra, { foreignKey: 'id_estado_actual' });

CategoriaObra.hasMany(Obra, { foreignKey: 'id_categoria_obra' });
Obra.belongsTo(CategoriaObra, { foreignKey: 'id_categoria_obra' });

Obra.hasOne(ImagenWeb, { foreignKey: 'id_obra', onDelete: 'CASCADE' });
ImagenWeb.belongsTo(Obra, { foreignKey: 'id_obra' });

Obra.hasMany(MovimientoObra, { foreignKey: 'id_obra' });
MovimientoObra.belongsTo(Obra, { foreignKey: 'id_obra' });

// --- Biblioteca ---
CategoriaLibro.hasMany(Libro, { foreignKey: 'id_categoria' });
Libro.belongsTo(CategoriaLibro, { foreignKey: 'id_categoria' });

Libro.hasMany(ConsultaSala, { foreignKey: 'id_libro' });
ConsultaSala.belongsTo(Libro, { foreignKey: 'id_libro' });

Persona.hasMany(ConsultaSala, { foreignKey: 'id_persona' });
ConsultaSala.belongsTo(Persona, { foreignKey: 'id_persona' });

Trabajador.hasMany(ConsultaSala, { foreignKey: 'id_trabajador' });
ConsultaSala.belongsTo(Trabajador, { foreignKey: 'id_trabajador' });

// libro_autores (Many-to-Many)
Libro.belongsToMany(AutorLibro, {
  through: 'libro_autores',
  foreignKey: 'id_libro',
  otherKey: 'id_autor',
  timestamps: false,
});
AutorLibro.belongsToMany(Libro, {
  through: 'libro_autores',
  foreignKey: 'id_autor',
  otherKey: 'id_libro',
  timestamps: false,
});

// --- Visitantes (Recepción) ---
Persona.hasMany(RegistroIngreso, { foreignKey: 'id_persona' });
RegistroIngreso.belongsTo(Persona, { foreignKey: 'id_persona' });

MotivoVisita.hasMany(RegistroIngreso, { foreignKey: 'id_motivo' });
RegistroIngreso.belongsTo(MotivoVisita, { foreignKey: 'id_motivo' });

Taller.hasMany(RegistroIngreso, { foreignKey: 'id_taller' });
RegistroIngreso.belongsTo(Taller, { foreignKey: 'id_taller' });

SolicitudEspacio.hasMany(RegistroIngreso, { foreignKey: 'id_solicitud' });
RegistroIngreso.belongsTo(SolicitudEspacio, { foreignKey: 'id_solicitud' });

// --- Educación y Talleres ---
InventarioTaller.hasMany(Taller, { foreignKey: 'inventario_id', as: 'talleresPlanificados' });
Taller.belongsTo(InventarioTaller, { foreignKey: 'inventario_id', as: 'inventarioTaller' });

Instructor.hasMany(Taller, { foreignKey: 'id_instructor' });
Taller.belongsTo(Instructor, { foreignKey: 'id_instructor' });

EspacioMuseo.hasMany(Taller, { foreignKey: 'id_espacio' });
Taller.belongsTo(EspacioMuseo, { foreignKey: 'id_espacio' });

// Alumnos y Representantes (Tabla Puente)
Alumno.belongsToMany(Representante, {
  through: AlumnoRepresentante,
  foreignKey: 'id_alumno',
  otherKey: 'id_representante',
  timestamps: false,
});
Representante.belongsToMany(Alumno, {
  through: AlumnoRepresentante,
  foreignKey: 'id_representante',
  otherKey: 'id_alumno',
  timestamps: false,
});

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

Persona.hasMany(SolicitudEspacio, { foreignKey: 'id_persona' });
SolicitudEspacio.belongsTo(Persona, { foreignKey: 'id_persona' });

TipoEvento.hasMany(SolicitudEspacio, { foreignKey: 'id_tipo_evento' });
SolicitudEspacio.belongsTo(TipoEvento, { foreignKey: 'id_tipo_evento' });

module.exports = {
  sequelize,
  TipoEvento,
  BitacoraAuditoria,
  Persona,
  Role,
  Usuario,
  CargoTrabajador,
  Turno,
  Trabajador,
  TrabajadorDocumento,
  TrabajadorHorario,
  TrabajadorJustificacion,
  AsistenciaQR,
  HistorialHorario,
  Artista,
  TecnicaObra,
  EstadoObra,
  CategoriaObra,
  Entrega,
  Obra,
  ImagenWeb,
  MovimientoObra,
  CategoriaLibro,
  AutorLibro,
  Libro,
  ConsultaSala,
  MotivoVisita,
  RegistroIngreso,
  ConfiguracionWeb,
  Instructor,
  Representante,
  Alumno,
  AlumnoRepresentante,
  EspacioMuseo,
  Taller,
  InscripcionTaller,
  SesionTaller,
  AsistenciaAlumno,
  SolicitudEspacio,
  InventarioTaller,
};
