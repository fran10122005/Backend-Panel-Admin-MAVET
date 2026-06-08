# API Reference

Base URL: `http://localhost:3000/api`

## Autenticación

Todas las rutas marcadas como **Token** requieren header:

```
Authorization: Bearer <jwt_token>
```

### Login

```
POST /auth/login
Content-Type: application/json

{
  "correo": "adminmavet@gmail.com",
  "contrasena": "admin123"
}

→ 200 { "token": "jwt...", "usuario": {...} }
```

### Registro

```
POST /auth/register
Content-Type: application/json

{
  "correo": "user@mail.com",
  "contrasena": "123456",
  "id_rol": 2
}
```

### Recuperar contraseña

```
POST /auth/forgot-password
Content-Type: application/json

{ "correo": "user@mail.com" }

POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token...",
  "nueva_contrasena": "nueva123"
}
```

### Perfil actual

```
GET /auth/me
Authorization: Bearer <token>

→ 200 { "id_usuario": 1, "correo": "...", "Role": {...} }
```

---

## RRHH

### Cargos

```
GET    /rrhh/cargos       → Listar todos
POST   /rrhh/cargos       → Crear { "nombre": "..." }
GET    /rrhh/cargos/:id   → Obtener uno
PUT    /rrhh/cargos/:id   → Actualizar
DELETE /rrhh/cargos/:id   → Eliminar
```

### Turnos

```
GET    /rrhh/turnos       → Listar todos
POST   /rrhh/turnos       → Crear
GET    /rrhh/turnos/:id   → Obtener uno
PUT    /rrhh/turnos/:id   → Actualizar
DELETE /rrhh/turnos/:id   → Eliminar
```

### Trabajadores

```
GET    /rrhh/trabajadores       → Listar todos (incluye cargo)
POST   /rrhh/trabajadores       → Crear
GET    /rrhh/trabajadores/:id   → Obtener uno (incluye cargo)
PUT    /rrhh/trabajadores/:id   → Actualizar (excepto horas_semanales)
DELETE /rrhh/trabajadores/:id   → Eliminar
```

`horas_semanales` solo se actualiza vía `/rrhh/horarios/trabajador/:id`.

### Asistencias QR

```
POST /rrhh/asistencias
Body: {
  "cedulaTrabajador": "V-12345678",
  "tipoMovimiento": "Entrada Mañana|Salida Mañana|Entrada Tarde|Salida Tarde",
  "timestamp": "2026-06-08T08:00:00.000Z"
}

→ 201 { "message": "...", "data": {...} }

GET /rrhh/asistencias
Authorization: Bearer <token>

→ 200 [ { ... } ]
```

Las horas cumplidas se calculan automáticamente al tener ambos registros (entrada + salida) de cada turno.

### Horarios

```
GET /rrhh/horarios/reporte-semanal
Authorization: Bearer <token>

→ 200 [ {
  "trabajador": { "id": 1, "cedula": "...", "nombres": "...", "apellidos": "...", "cargo": "..." },
  "horas_semanales": 40,
  "horas_acumuladas": 35.5,
  "horas_restantes": 4.5,
  "estado": "En curso|Completo|Incompleto",
  "dias_asistidos": 5
} ]

PUT /rrhh/horarios/trabajador/:id
Authorization: Bearer <token>
Body: { "horas_nuevas": 40, "motivo": "Cambio de horario por..." }

→ 200 { "message": "...", "data": {...} }

GET /rrhh/horarios/trabajador/:id/historial
Authorization: Bearer <token>

→ 200 [ { "horas_anteriores": 35, "horas_nuevas": 40, "motivo": "...", "fecha_cambio": "...", "Usuario": {...} } ]
```

---

## Obras

### Catálogos públicos

```
GET /obras/artistas      → Listar artistas
GET /obras/tecnicas      → Listar técnicas
GET /obras/estados       → Listar estados
GET /obras/categorias    → Listar categorías
```

### CRUD (requiere token)

```
GET    /obras/obras            → Listar
POST   /obras/obras            → Crear
GET    /obras/obras/:id        → Obtener
PUT    /obras/obras/:id        → Actualizar
DELETE /obras/obras/:id        → Eliminar

GET    /obras/artistas         → Listar
POST   /obras/artistas         → Crear
GET    /obras/artistas/:id     → Obtener
PUT    /obras/artistas/:id     → Actualizar
DELETE /obras/artistas/:id     → Eliminar

...similar para tecnicas, estados, entregas
```

---

## Biblioteca

```
GET    /biblioteca/libros              → Listar
POST   /biblioteca/libros              → Crear
GET    /biblioteca/libros/:id          → Obtener
PUT    /biblioteca/libros/:id          → Actualizar
DELETE /biblioteca/libros/:id          → Eliminar

GET    /biblioteca/autores             → Listar autores
POST   /biblioteca/autores             → Crear
...

GET    /biblioteca/categorias          → Listar categorías
...

GET    /biblioteca/consultas-sala      → Listar consultas
POST   /biblioteca/consultas-sala      → Crear consulta
```

---

## Educación

```
CRUD /educacion/instructores
CRUD /educacion/representantes
CRUD /educacion/alumnos
CRUD /educacion/espacios
CRUD /educacion/talleres
CRUD /educacion/solicitudes-espacio
CRUD /educacion/inscripciones-talleres
```

---

## Visitantes

```
GET  /visitantes/motivos              → Listar motivos (público)
POST /visitantes/visitantes           → Registrar visitante
GET  /visitantes/ingresos             → Listar ingresos
POST /visitantes/ingresos             → Registrar ingreso
```

---

## Personas

```
GET /personas/buscar?q=cedula_o_nombre
Authorization: Bearer <token>

→ 200 { "message": "Búsqueda completada", "data": [...] }
```

Busca por cédula, nombres, apellidos o teléfono. Resuelve automáticamente representantes de menores y menores asociados a adultos.

---

## Reportes

```
GET /reportes/*
Authorization: Bearer <token>
```

Genera PDF según el reporte solicitado.

---

## Health Check

```
GET /

→ 200 { "message": "Backend MAVET - Activo" }
```

## Códigos de error

| Código | Significado |
|---|---|
| 400 | Bad Request (validación) |
| 401 | No autenticado |
| 403 | No autorizado (rol) |
| 404 | Recurso no encontrado |
| 429 | Rate limit excedido |
| 500 | Error interno |
