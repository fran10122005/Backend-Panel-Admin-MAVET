# Base de Datos

## Motor

- **Producción**: PostgreSQL 15+ (Neon)
- **Tests**: SQLite

## Modelos (28 tablas)

### Auth

| Tabla | PK | Descripción |
|---|---|---|
| `roles` | `id_rol` | Roles del sistema |
| `usuarios` | `id_usuario` | Usuarios del sistema |
| `bitacora_auditoria` | `id_auditoria` | Auditoría *(pendiente de implementar)* |

### Persona (Tabla Maestra)

| Tabla | PK | Descripción |
|---|---|---|
| `personas` | `id_persona` | Datos maestros de personas (naturales) |

### RRHH

| Tabla | PK | FK | Descripción |
|---|---|---|---|
| `cargos_trabajador` | `id_cargo` | - | Catálogo de cargos |
| `turnos` | `id_turno` | - | Catálogo de turnos |
| `trabajadores` | `id_trabajador` | `id_cargo`, `id_usuario` | Trabajadores del museo |
| `trabajador_turnos` | - | `id_trabajador`, `id_turno` | M:N trabajador ↔ turno |
| `asistencias_qr` | `id_asistencia` | `id_trabajador` | Registro diario de asistencia |
| `historial_horario` | `id_historial` | `id_trabajador`, `id_usuario_modifica` | Log de cambios de horas semanales |

### Obras

| Tabla | PK | FK | Descripción |
|---|---|---|---|
| `artistas` | `id_artista` | - | Artistas |
| `tecnicas_obra` | `id_tecnica` | - | Técnicas |
| `estados_obra` | `id_estado` | - | Estados |
| `categorias_obra` | `id_categoria` | - | Categorías |
| `entregas` | `id_entrega` | - | Entregas |
| `obras` | `id_obra` | `id_artista`, `id_tecnica`, `id_estado_actual`, `id_categoria_obra`, `id_entrega` | Obras de arte |
| `historial_ubicacion_obra` | `id_historial` | `id_obra`, `id_usuario`, `id_estado_anterior`, `id_estado_nuevo` | Historial de ubicación/estado |

### Biblioteca

| Tabla | PK | FK | Descripción |
|---|---|---|---|
| `categorias_libro` | `id_categoria` | - | Categorías de libros |
| `autores_libro` | `id_autor` | - | Autores |
| `libros` | `id_libro` | `id_categoria` | Libros |
| `libro_autores` | - | `id_libro`, `id_autor` | M:N libro ↔ autor |
| `consultas_sala` | `id_consulta` | `id_libro`, `id_persona`, `id_trabajador` | Consultas en sala |

### Visitantes

| Tabla | PK | FK | Descripción |
|---|---|---|---|
| `motivos_visita` | `id_motivo` | - | Motivos de visita |
| `registros_ingreso` | `id_ingreso` | `id_persona`, `id_motivo`, `id_taller` | Ingresos de visitantes |

### Educación

| Tabla | PK | FK | Descripción |
|---|---|---|---|
| `instructores` | `id_instructor` | `id_persona` | Instructores de talleres |
| `representantes` | `id_representante` | `id_persona` | Representantes |
| `alumnos` | `id_alumno` | `id_persona` | Alumnos |
| `alumnos_representantes` | - | `id_alumno`, `id_representante` | M:N alumno ↔ representante |
| `espacios_museo` | `id_espacio` | - | Espacios físicos del museo |
| `talleres` | `id_taller` | `id_instructor`, `id_espacio` | Talleres educativos |
| `inscripciones_taller` | `id_inscripcion` | `id_taller`, `id_alumno` | Inscripciones a talleres |
| `sesiones_taller` | `id_sesion` | `id_taller` | Sesiones de taller |
| `asistencias_alumno` | `id_asistencia` | `id_sesion`, `id_alumno` | Asistencia por sesión |
| `solicitudes_espacio` | `id_solicitud` | `id_espacio`, `id_persona` | Solicitudes de uso de espacios |

## Asociaciones clave

```
Persona ──┬── Alumno
           ├── Instructor
           ├── Representante
           ├── ConsultaSala
           ├── RegistroIngreso
           └── SolicitudEspacio

Usuario ──┬── Role
          ├── Trabajador
          ├── BitacoraAuditoria
          ├── HistorialUbicacionObra
          └── HistorialHorario (como id_usuario_modifica)

Trabajador ──┬── CargoTrabajador
             ├── Turno (M:N)
             ├── AsistenciaQR
             ├── ConsultaSala
             └── HistorialHorario

Obra ──┬── Artista
       ├── TecnicaObra
       ├── EstadoObra
       ├── CategoriaObra
       ├── Entrega
       └── HistorialUbicacionObra
```

## Soft Delete

Los siguientes modelos usan `paranoid: true` (borrado lógico con `deleted_at`):

- `usuarios`
- `trabajadores` (según implementación)
- `obras`
- `talleres`

## Trigger de auditoría

La base de datos en Neon tiene (o tuvo) un trigger `funcion_auditoria_mavet` que bloqueaba INSERT/UPDATE. Si encuentras errores de `permission denied`, fue removido vía script.
