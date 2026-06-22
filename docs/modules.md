# Módulos

## Auth (`/api/auth`)

Autenticación, gestión de usuarios y roles.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | - | Iniciar sesión |
| POST | `/api/auth/register` | - | Registrar usuario |
| POST | `/api/auth/forgot-password` | - | Solicitar recuperación |
| POST | `/api/auth/reset-password` | - | Restablecer contraseña |
| GET | `/api/auth/me` | Token | Perfil del usuario actual |
| GET/POST/PUT/DELETE | `/api/auth/roles` | Token | CRUD de roles |

### Modelos

- **Usuario** — `id_usuario`, correo, contraseña, estado, `id_rol`
- **Role** — `id_rol`, nombre, descripción
- **BitacoraAuditoria** — (pendiente de implementar) registra operaciones sobre datos

---

## RRHH (`/api/rrhh`)

Recursos humanos: trabajadores, cargos, turnos, asistencias QR y horarios semanales.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| CRUD | `/api/rrhh/cargos` | Token | Gestión de cargos |
| CRUD | `/api/rrhh/turnos` | Token | Gestión de turnos |
| CRUD | `/api/rrhh/trabajadores` | Token | Gestión de trabajadores |
| POST/GET | `/api/rrhh/asistencias` | Mixto | Registrar/consultar asistencias QR |
| GET | `/api/rrhh/horarios/reporte-semanal` | Token | Reporte semanal de cumplimiento |
| PUT | `/api/rrhh/horarios/trabajador/:id` | Token | Actualizar horas semanales (solo domingo) |
| GET | `/api/rrhh/horarios/trabajador/:id/historial` | Token | Historial de cambios de horario |

### Lógica de horario semanal

- Cada trabajador tiene `horas_semanales` (requeridas)
- Las asistencias QR registran entrada/salida y calculan `horas_cumplidas_dia`
- El reporte semanal suma las horas acumuladas de lunes a sábado y las compara con las requeridas
- El cambio de `horas_semanales` solo se permite los domingos y queda registrado en `historial_horario` con motivo

### Modelos

- **Trabajador** — datos personales, `horas_semanales`, QR UUID, cargo
- **CargoTrabajador** — catálogo de cargos
- **Turno** — catálogo de turnos (M:N con trabajadores)
- **AsistenciaQR** — registro diario: entrada/salida mañana y tarde, horas cumplidas
- **HistorialHorario** — log de cambios de `horas_semanales`

---

## Obras (`/api/obras`)

Gestión del inventario de obras de arte.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/obras/artistas` | Público | Listar artistas (catálogo) |
| GET | `/api/obras/tecnicas` | Público | Listar técnicas (catálogo) |
| GET | `/api/obras/estados` | Público | Listar estados (catálogo) |
| GET | `/api/obras/categorias` | Público | Listar categorías (catálogo) |
| CRUD | `/api/obras/artistas` | Token | Gestión de artistas |
| CRUD | `/api/obras/tecnicas` | Token | Gestión de técnicas |
| CRUD | `/api/obras/estados` | Token | Gestión de estados |
| CRUD | `/api/obras/entregas` | Token | Gestión de entregas |
| CRUD | `/api/obras/obras` | Token | Gestión de obras |
| - | `/api/obras/categorias` | Token | CRUD de categorías *(pendiente)* |

### Modelos

- **Obra** — datos de la obra, imágenes, códigos, fechas
- **Artista** — nombre, biografía, redes
- **TecnicaObra** — catálogo de técnicas
- **EstadoObra** — catálogo de estados
- **CategoriaObra** — catálogo de categorías
- **Entrega** — registro de entrega/recepción
- **HistorialUbicacionObra** — historial de cambios de ubicación/estado

---

## Biblioteca (`/api/biblioteca`)

Gestión de libros y consultas en sala de lectura.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| CRUD | `/api/biblioteca/libros` | Token | Gestión de libros |
| CRUD | `/api/biblioteca/autores` | Token | Gestión de autores |
| CRUD | `/api/biblioteca/categorias` | Token | Categorías de libros |
| CRUD | `/api/biblioteca/consultas-sala` | Token | Registro de consultas en sala |

### Modelos

- **Libro** — título, unidad, cuota, año, estante, cantidad, categoría
- **AutorLibro** — nombre del autor
- **CategoriaLibro** — nombre de la categoría
- **ConsultaSala** — registro de consulta (persona, libro, trabajador que atendió)

---

## Educación (`/api/educacion`)

Gestión de talleres educativos, alumnos e instructores.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| CRUD | `/api/educacion/instructores` | Token | Gestión de instructores |
| CRUD | `/api/educacion/representantes` | Token | Gestión de representantes |
| CRUD | `/api/educacion/alumnos` | Token | Gestión de alumnos |
| CRUD | `/api/educacion/espacios` | Token | Espacios del museo |
| CRUD | `/api/educacion/talleres` | Token | Talleres |
| CRUD | `/api/educacion/solicitudes-espacio` | Token | Solicitudes de uso de espacios |
| CRUD | `/api/educacion/inscripciones-talleres` | Token | Inscripciones a talleres |

### Modelos

- **Instructor** — vinculado a Persona
- **Representante** — vinculado a Persona (M:N con Alumno)
- **Alumno** — vinculado a Persona
- **AlumnoRepresentante** — tabla puente
- **EspacioMuseo** — salas/espacios disponibles
- **Taller** — datos del taller, fechas, instructor, espacio
- **InscripcionTaller** — inscripción de alumno a taller
- **SesionTaller** — sesiones de cada taller
- **AsistenciaAlumno** — asistencia por sesión
- **SolicitudEspacio** — solicitudes de uso de espacios externos

---

## Visitantes (`/api/visitantes`)

Registro de ingreso de visitantes al museo.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/visitantes/motivos` | Público | Motivos de visita (catálogo) |
| POST | `/api/visitantes/visitantes` | Público | Registro público de visitante |
| GET | `/api/visitantes/ingresos` | Público | Registrar/consultar ingresos |

### Modelos

- **MotivoVisita** — catálogo de motivos
- **RegistroIngreso** — registro con persona, motivo, fecha, taller (opcional)

---

## Personas (`/api/personas`)

Búsqueda maestra de personas en el sistema.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/personas/buscar?q=` | Token | Buscar por cédula, nombre, apellido o teléfono |

### Particularidades

- Resuelve automáticamente representantes de menores de edad
- Resuelve menores asociados a adultos
- Calcula edad desde `fecha_de_nac`
- Detecta si la cédula necesita actualización

---

## Reportes (`/api/reportes`)

Generación de reportes en PDF.

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/reportes/*` | Token | Reportes varios |

### Tecnología

- Generación de PDF con **pdfkit** puro (mediante buffers de memoria asíncronos para mayor estabilidad)
- Exportación a Excel con **exceljs**
- Carta Aval también en PDF usando pdfkit
