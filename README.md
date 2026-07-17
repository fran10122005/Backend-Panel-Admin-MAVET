# MAVET Backend API

API RESTful del **Museo de Artes Visuales y del Espacio del Táchira**. Arquitectura modular monolith en Node.js + Express v5 + Sequelize v6 + PostgreSQL.

---

## Stack

| Capa | Tecnología | Propósito |
|---|---|---|
| Runtime | Node.js | CommonJS modules |
| Framework | Express v5 | Routing, middleware |
| ORM | Sequelize v6 | Models, migrations, associations |
| DB Producción | PostgreSQL (Neon) | `pg` driver |
| DB Testing | SQLite en memoria | `sqlite3` driver |
| Cache | Redis (`ioredis`) + fallback Map | Response caching |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` | Tokens en cookie + Bearer |
| Validación | Zod v4 | Schemas de request body/query/params |
| Archivos | Multer + Sharp | Upload local + compresión |
| Almacenamiento | Cloudinary (v2 SDK) | Imágenes en nube |
| PDF | PDFKit | Reportes, carnet, carta aval, QR |
| Email | Nodemailer + Handlebars | Plantillas HTML |
| Tareas | node-cron | Auto-actualización de reservas |
| Testing | Jest + Supertest | Tests de integración |
| Code Quality | ESLint + Prettier + Husky | Pre-commit hooks |

---

## Convenciones y Patrones

### Arquitectura Modular

Cada módulo de negocio en `src/modules/<modulo>/` contiene:

```
controllers/   # Express handlers: parse req, call service, send res
services/      # Business logic + DB queries, lanzan AppError
models/        # Sequelize model definitions
routes/        # Express Router con HTTP verbs + middleware
schemas/       # Zod validation schemas
templates/     # Handlebars templates (email)
```

**Reglas:**
- Controllers NO tienen lógica de negocio, solo orquestan req/res
- Services NO acceden a `req`/`res`, reciben datos planos y devuelven resultados
- Models definen campos, validaciones y hooks de Sequelize
- Schemas centralizan validación con Zod
- Rutas solo montan middleware y controllers

### Flujo de una Request

```
Request → Middleware globales → Rate Limiter → verifyToken (JWT)
  → cache/limpiarCache → validateZod → Controller → Service → Model → DB
  → Response JSON
```

### Manejo de Errores

`errorHandler.js` captura:
- `SequelizeUniqueConstraintError` → mensaje amigable de campo duplicado
- `SequelizeValidationError` → errores de validación del modelo
- `SequelizeForeignKeyConstraintError` → error al eliminar registros referenciados
- `ZodError` → errores de validación del schema
- `AppError` (clase custom) → errores operacionales con statusCode
- Cualquier otro → error 500 genérico

### Caché

Sistema híbrido: Redis cuando está disponible, Map en memoria como fallback.
- Endpoints GET con `cache(ttl)` guardan respuesta
- Endpoints mutantes con `limpiarCache(...patrones)` invalidan claves relacionadas
- Claves con formato `mavet:resp:/api/...`

### Autenticación

`verifyToken` soporta dos métodos:
1. `Authorization: Bearer <token>` (header)
2. `token=<jwt>` (cookie, httpOnly)

`requireRoles('Admin', 'Gerente')` restringe por nombre de rol.

### Validación Zod

Middleware `validateZod` acepta:
- Schema directo → valida `req.body`
- `{ body, query, params }` → valida cada parte

Todos los schemas están en `schemas/` de cada módulo.

---

## Estructura de Archivos

```
src/
├── server.js                    # Entry: middleware global, montaje de rutas, sync DB, cron
├── cronJobs.js                  # node-cron: actualiza reservas vencidas → "Realizada"
│
├── config/
│   ├── db.js                    # Sequelize: PostgreSQL (prod/dev), SQLite (test)
│   ├── redis.js                 # ioredis: conexión con retryStrategy
│   └── cloudinary.js            # Cloudinary SDK config
│
├── models/index.js              # Registry central: importa 34 modelos + define asociaciones
│
├── middleware/
│   ├── authMiddleware.js        # verifyToken (JWT cookie/Bearer) + requireRoles
│   ├── cacheMiddleware.js       # cache(ttl) + limpiarCache(patrones)
│   ├── errorHandler.js          # Global error handler (Sequelize, Zod, AppError)
│   ├── uploadMiddleware.js      # Multer disk storage + Sharp compression
│   └── validateSchema.js        # Zod validation middleware
│
├── services/
│   ├── cache.service.js         # Redis + Map fallback (get/set/del/clear/wrap)
│   ├── email.service.js         # Nodemailer + Handlebars templates
│   └── validator.service.js     # Validaciones de negocio (fechas, solapamiento)
│
├── utils/
│   ├── AppError.js              # Custom Error class (isOperational, statusCode)
│   ├── catchAsync.js            # Async wrapper para controllers
│   ├── cedula.js                # Normalización de cédula venezolana
│   └── pdfGenerator.js          # PDFKit: reportes, carta aval, carnet CR80, QR
│
├── seeders/
│   ├── catalogosObras.js        # Técnicas, estados, categorías, artistas
│   ├── catalogosRRHH.js         # Cargos y turnos
│   ├── espaciosMuseo.js         # Espacios físicos del museo
│   └── motivosVisita.js         # Motivos de visita (recepción)
│
└── modules/
    ├── auth/                    # Auth, roles, auditoría
    ├── personas/                # Personas (tabla maestra)
    ├── rrhh/                    # RRHH: trabajadores, cargos, turnos, asistencias QR, horarios
    ├── obras/                   # Obras, artistas, técnicas, estados, categorías, entregas, imágenes web, movimientos
    ├── biblioteca/              # Libros, autores, categorías, consultas en sala
    ├── visitantes/              # Ingresos, motivos, auto-ingreso QR público
    ├── educacion/               # Talleres, instructores, alumnos, representantes, espacios, inscripciones, sesiones, solicitudes de espacio, inventario
    ├── reportes/                # Reportes PDF, dashboard, carnet, credenciales masivas
    ├── papelera/                # Papelera de reciclaje (restaurar/eliminar definitivo)
    └── contacto/                # Formulario de contacto público
```

---

## Modelos de Datos (34 modelos, ~30 tablas)

### Auth
| Modelo | Tabla | PK | Descripción |
|---|---|---|---|
| `Usuario` | `usuarios` | `id_usuario` | Usuarios del sistema, JWT, bloqueo por intentos |
| `Role` | `roles` | `id_rol` | Roles: Administrador, Gerente, Coordinador, Recepcionista |
| `BitacoraAuditoria` | `bitacora_auditoria` | `id_auditoria` | Logs de login/logout/create/update/delete |

### Personas
| Modelo | Tabla | PK | Descripción |
|---|---|---|---|
| `Persona` | `personas` | `id_persona` | Tabla maestra de personas físicas |

### RRHH
| Modelo | Tabla | PK |
|---|---|---|
| `CargoTrabajador` | `cargos_trabajador` | `id_cargo` |
| `Turno` | `turnos` | `id_turno` |
| `Trabajador` | `trabajadores` | `id_trabajador` |
| `AsistenciaQR` | `asistencias_qr` | `id_asistencia` |
| `HistorialHorario` | `historial_horario` | `id_historial` |

### Obras
| Modelo | Tabla | PK |
|---|---|---|
| `Artista` | `artistas` | `id_artista` |
| `TecnicaObra` | `tecnicas_obras` | `id_tecnica` |
| `EstadoObra` | `estados_obras` | `id_estado` |
| `CategoriaObra` | `categoria_obra` | `id_categoria_obra` |
| `Entrega` | `entrega` | `id_entrega` |
| `Obra` | `obras` | `id_obra` |
| `ImagenWeb` | `imagenes_web` | `id_imagen` |
| `MovimientoObra` | `movimientos_obras` | `id_movimiento` |

### Biblioteca
| Modelo | Tabla | PK |
|---|---|---|
| `CategoriaLibro` | `categorias_libros` | `id_categoria` |
| `AutorLibro` | `autores_libros` | `id_autor` |
| `Libro` | `libros` | `id_libro` |
| `ConsultaSala` | `consultas_sala` | `id_consulta` |

### Visitantes
| Modelo | Tabla | PK |
|---|---|---|
| `MotivoVisita` | `motivos_visita` | `id_motivo` |
| `RegistroIngreso` | `registros_ingresos` | `id_ingreso` |

### Educación
| Modelo | Tabla | PK |
|---|---|---|
| `Instructor` | `instructores` | `id_instructor` |
| `Representante` | `representantes` | `id_representante` |
| `Alumno` | `alumnos` | `id_alumno` |
| `AlumnoRepresentante` | `alumnos_representantes` | `id_alumno` + `id_representante` |
| `EspacioMuseo` | `espacios_museo` | `id_espacio` |
| `Taller` | `talleres` | `id_taller` |
| `InscripcionTaller` | `inscripciones_talleres` | `id_inscripcion` |
| `SesionTaller` | `sesiones_talleres` | `id_sesion` |
| `AsistenciaAlumno` | `asistencias_alumnos` | `id_asistencia_alumno` |
| `SolicitudEspacio` | `solicitudes_espacios` | `id_solicitud` |
| `InventarioTaller` | `inventario_talleres` | `id` |

### Junction Tables (auto-creadas por belongsToMany)
- `trabajador_turnos` (Trabajador ↔ Turno)
- `libro_autores` (Libro ↔ AutorLibro)

### Asociaciones Clave

```
Persona ──hasMany──→ Alumno, Instructor, Representante
Persona ──hasMany──→ RegistroIngreso, ConsultaSala, SolicitudEspacio

Role ──hasMany──→ Usuario
Usuario ──hasOne──→ Trabajador

CargoTrabajador ──hasMany──→ Trabajador
Trabajador ──belongsToMany──→ Turno (trabajador_turnos)
Trabajador ──hasMany──→ AsistenciaQR, HistorialHorario

Artista ──hasMany──→ Obra
TecnicaObra ──hasMany──→ Obra
EstadoObra ──hasMany──→ Obra
CategoriaObra ──hasMany──→ Obra
Entrega ──hasMany──→ Obra
Obra ──hasOne──→ ImagenWeb
Obra ──hasMany──→ MovimientoObra

CategoriaLibro ──hasMany──→ Libro
Libro ──belongsToMany──→ AutorLibro (libro_autores)
Libro ──hasMany──→ ConsultaSala

MotivoVisita ──hasMany──→ RegistroIngreso
Taller ──hasMany──→ RegistroIngreso
SolicitudEspacio ──hasMany──→ RegistroIngreso

InventarioTaller ──hasMany──→ Taller
Instructor ──hasMany──→ Taller
EspacioMuseo ──hasMany──→ Taller
Taller ──hasMany──→ InscripcionTaller, SesionTaller
Alumno ──hasMany──→ InscripcionTaller, AsistenciaAlumno
Alumno ──belongsToMany──→ Representante (AlumnoRepresentante)
SesionTaller ──hasMany──→ AsistenciaAlumno

EspacioMuseo ──hasMany──→ SolicitudEspacio
Usuario ──hasMany──→ SolicitudEspacio
```

---

## API Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Cache | Descripción |
|---|---|---|---|
| GET | `/api/public/obras` | 300s | Obras para portal público |
| GET | `/api/public/imagenes-web` | 600s | Banners y galería |
| GET | `/api/public/agenda` | 300s | Talleres + eventos aprobados |
| GET | `/api/public/libros` | 300s | Libros públicos |
| POST | `/api/public/contacto` | - | Formulario de contacto |
| POST | `/api/auth/register` | - | Registro de usuario |
| POST | `/api/auth/login` | - | Inicio de sesión |
| POST | `/api/auth/forgot-password` | - | Solicitar recuperación |
| POST | `/api/auth/reset-password` | - | Resetear contraseña |
| GET | `/api/publico/visitantes/check/:cedula` | - | Verificar visitante |
| POST | `/api/publico/visitantes/ingreso` | - | Auto-ingreso QR |
| GET | `/api/obras/artistas` | 600s | Catálogo público artistas |
| GET | `/api/obras/tecnicas` | 600s | Catálogo público técnicas |
| GET | `/api/obras/estados` | 600s | Catálogo público estados |
| GET | `/api/obras/categorias` | 600s | Catálogo público categorías |
| GET | `/api/rrhh/asistencias/estado` | - | Estado actual (kiosko) |
| GET | `/api/visitantes/ingresos/check/:cedula` | - | Check visitante recepción |

### Protegidos (requieren JWT)

| Método | Ruta | Módulo |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/auth/` | CRUD usuarios |
| GET/POST/PUT/DELETE | `/api/auth/roles/` | CRUD roles |
| POST/DELETE | `/api/auth/me/foto` | Foto de perfil |
| GET | `/api/auth/logs` | Auditoría (Admin/Gerente) |
| GET | `/api/auth/export/pdf` | Exportar usuarios PDF |
| GET | `/api/personas/buscar` | Buscar personas |
| CRUD | `/api/rrhh/cargos/` | Cargos |
| CRUD | `/api/rrhh/turnos/` | Turnos |
| CRUD | `/api/rrhh/trabajadores/` | Trabajadores (+foto) |
| CRUD | `/api/rrhh/asistencias/` | Asistencias QR |
| CRUD | `/api/rrhh/horarios/` | Historial de horas |
| CRUD | `/api/obras/obras/` | Obras (+imagen) |
| CRUD | `/api/obras/artistas/` | Artistas |
| CRUD | `/api/obras/tecnicas/` | Técnicas |
| CRUD | `/api/obras/estados/` | Estados |
| CRUD | `/api/obras/categorias/` | Categorías |
| CRUD | `/api/obras/entregas/` | Entregas |
| CRUD | `/api/obras/imagenes-web/` | Imágenes web |
| GET/POST | `/api/obras/:id/historial` | Movimientos de obra |
| CRUD | `/api/biblioteca/libros/` | Libros |
| CRUD | `/api/biblioteca/autores/` | Autores |
| CRUD | `/api/biblioteca/categorias/` | Categorías |
| CRUD | `/api/biblioteca/consultas-sala/` | Consultas en sala |
| CRUD | `/api/visitantes/ingresos/` | Ingresos |
| CRUD | `/api/visitantes/motivos/` | Motivos de visita |
| CRUD | `/api/educacion/instructores/` | Instructores |
| CRUD | `/api/educacion/representantes/` | Representantes |
| CRUD | `/api/educacion/alumnos/` | Alumnos |
| CRUD | `/api/educacion/espacios/` | Espacios del museo |
| CRUD | `/api/educacion/talleres/` | Talleres + inventario |
| CRUD | `/api/educacion/solicitudes-espacio/` | Solicitudes + aprobar/rechazar |
| CRUD | `/api/educacion/inscripciones-talleres/` | Inscripciones |
| CRUD | `/api/educacion/sesiones/` | Sesiones + asistencias |
| GET | `/api/reportes/*` | Reportes PDF, dashboard, carnet |
| GET/POST/DELETE | `/api/papelera/` | Papelera de reciclaje |

---

## Seguridad

- **Helmet**: cabeceras HTTP seguras
- **CORS**: solo orígenes permitidos (configurado en `FRONTEND_URL`)
- **Rate Limiting**: por ruta (login: 10/15min, registro: 5/15min, API general: 500-10000/15min)
- **JWT dual**: cookie httpOnly + Bearer header
- **Bloqueo de cuenta**: 5 intentos fallidos → bloqueo 30 min
- **Validación Zod**: todos los endpoints POST/PUT validan el body
- **Soft delete**: modelos principales con `paranoid: true` y papelera de reciclaje
- **Error sanitization**: en producción no se muestran stack traces

---

## Migraciones

No hay archivos de migración tradicionales. El esquema se gestiona:
1. `sequelize.sync()` crea tablas desde modelos (seguro, sin `force`)
2. `server.js::migrateTablas()` ejecuta `ALTER TABLE ADD COLUMN IF NOT EXISTS` y `CREATE TABLE IF NOT EXISTS` para mantener compatibilidad con BD existentes

---

## Comandos

```bash
npm run dev              # Desarrollo (nodemon)
npm start                # Producción
npm test                 # Tests (Jest + Supertest, SQLite)
seed:motivos             # Motivos de visita
seed:rrhh                # Catálogos RRHH
seed:espacios            # Espacios del museo
seed:obras               # Catálogos de obras
```

---

## Variables de Entorno

Ver `.env.example`. Las críticas:

| Variable | Ejemplo |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | `mavet_jwt_secret_2025` |
| `JWT_EXPIRES_IN` | `1d` |
| `CLOUDINARY_CLOUD_NAME` | `dw76ookno` |
| `CLOUDINARY_API_KEY` | `155824665117719` |
| `CLOUDINARY_API_SECRET` | `D_4gBp3DFcN8835RsSXtjbcfRJU` |
| `REDIS_URL` | `redis://localhost:6379` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_USER` | `adminmavet@gmail.com` |
| `SMTP_PASS` | app password de Gmail |
| `FRONTEND_URL` | `http://localhost:5173` |
