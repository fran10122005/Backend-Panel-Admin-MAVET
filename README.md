# Backend Panel Administrativo MAVET

API REST para el sistema de gestión administrativa del **Museo de Artes Visuales y del Espacio del Táchira (MAVET)**.

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Sequelize 6 |
| BD Producción | PostgreSQL (Neon) |
| BD Tests | SQLite |
| Validación | Zod 4 |
| Auth | JWT + bcryptjs |
| Testing | Jest + Supertest |
| Email | Nodemailer + Handlebars |
| Exportación | PDFKit + ExcelJS |

## Requisitos

- Node.js 18+
- npm

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DATABASE_URL, JWT_SECRET, SMTP...)

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

El servidor arranca en `http://localhost:3000` y sincroniza los modelos con la BD automáticamente.

## Auth por defecto

- **Admin**: `adminmavet@gmail.com` / `admin123`

## Tests

```bash
npm test
```

## Estructura de carpetas

```
Backend-Panel-Admin-MAVET/
├── src/
│   ├── server.js              # Punto de entrada
│   ├── config/db.js           # Conexión Sequelize
│   ├── models/index.js        # Modelos centralizados + asociaciones
│   ├── middleware/             # Auth, errores, validación
│   ├── services/              # Email service (compartido)
│   ├── utils/                 # AppError, catchAsync, PDF generator
│   └── modules/               # Módulos por dominio
│       ├── auth/              # Autenticación, roles, usuarios
│       ├── rrhh/              # RH, asistencias, horarios
│       ├── obras/             # Obras de arte, artistas
│       ├── biblioteca/        # Libros, autores, consultas en sala
│       ├── educacion/         # Talleres, alumnos, instructores
│       ├── visitantes/        # Registro de ingreso de visitantes
│       ├── personas/          # Búsqueda maestra de personas
│       └── reportes/          # Reportes PDF
├── tests/
│   ├── integration/           # Tests Jest
│   └── scripts/               # Scripts utilitarios
└── docs/                      # Documentación detallada
```

## Documentación

Ver [docs/](/docs) para documentación detallada de:
- [Arquitectura](docs/architecture.md)
- [Módulos](docs/modules.md)
- [Base de datos](docs/database.md)
- [API](docs/api.md)
