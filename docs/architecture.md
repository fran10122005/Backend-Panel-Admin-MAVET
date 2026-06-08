# Arquitectura

## Patrón: Modular MVC

El proyecto organiza el código en **módulos por dominio de negocio**, cada uno con su propia estructura MVC (Modelo-Vista-Controlador) más una capa de servicios.

```
src/modules/<modulo>/
├── models/        # Definiciones Sequelize
├── controllers/   # Manejadores de rutas Express
├── services/      # Lógica de negocio
└── routes/        # Definición de rutas Express
    └── index.js   # Agregador de rutas del módulo
```

## Flujo de una petición

```
Cliente → server.js → middleware global → módulo.routes → controller → service → model → DB
                                                ↓
                                         authMiddleware (verifyToken / requireRoles)
```

1. **server.js** configura middlewares globales (CORS, helmet, rate-limit, morgan) y monta las rutas de cada módulo.
2. Cada módulo expone sus rutas a través de `routes/index.js`.
3. Los **controllers** reciben `req/res`, delegan la lógica a los **services** y responden.
4. Los **services** contienen toda la lógica de negocio, consultas a modelos y manejo de errores.
5. Los **models** definen tablas, campos y asociaciones Sequelize.

## Middlewares globales

| Middleware | Propósito |
|---|---|
| `helmet` | Seguridad HTTP |
| `cors` | Orígenes permitidos (configurable vía `FRONTEND_URL`) |
| `express.json` | Parseo de JSON |
| `morgan` | Logging de peticiones |
| `express-rate-limit` | Rate limiting (`/api`) |

## Middlewares propios

| Middleware | Archivo | Propósito |
|---|---|---|
| `verifyToken` | `middleware/authMiddleware.js` | Verifica JWT y adjunta `req.usuario` |
| `requireRoles(...)` | `middleware/authMiddleware.js` | Restringe por roles |
| `validateSchema` | `middleware/validateSchema.js` | Valida body con Zod |
| `notFound` | `middleware/errorHandler.js` | Captura rutas inexistentes (404) |
| `errorHandler` | `middleware/errorHandler.js` | Manejador global de errores |

## Seguridad

- Autenticación mediante **JWT** (token en header `Authorization: Bearer <token>`)
- Contraseñas hasheadas con **bcryptjs**
- **Rate limiting** de 100 req/15 min en producción por IP
- **Helmet** para headers de seguridad HTTP
- **CORS** restringido a orígenes configurados
- **Soft delete** (`paranoid: true`) en modelos que lo requieren

## Sincronización con BD

Al iniciar, `server.js` ejecuta `sequelize.sync()` que crea las tablas según la definición de los modelos. No se requieren migraciones manuales.
