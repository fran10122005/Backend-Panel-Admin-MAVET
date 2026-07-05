# MAVET Backend — Agent Guide

## Commands

```sh
npm run dev        # nodemon (development)
npm start          # node src/server.js (production)
npm test           # cross-env NODE_ENV=test jest --detectOpenHandles --forceExit
```

Pre-commit: husky runs lint-staged → `eslint --fix && prettier --write` on staged `.js`.

## Architecture

Modular MVC per domain under `src/modules/<name>/`:
- `models/` — Sequelize model files (singular, PascalCase)
- `controllers/` — Express request handlers
- `services/` — Business logic
- `routes/index.js` — Route aggregator

All **associations** live in `src/models/index.js` (not in individual model files). Every module's `routes/index.js` is mounted in `src/server.js`.

**Entrypoint:** `src/server.js` — loads middleware in order:
1. helmet, cors, express.json, morgan
2. Static `/uploads` → `public/uploads/`
3. Rate limiter on `/api`
4. Routes (public first, then protected with `verifyToken` at server or route level)
5. `notFound` then `errorHandler` (LAST — do not add routes after these)

## Key Conventions

- **Error handling:** Controllers use `catchAsync` wrapper. Never raw try/catch in controllers. Throw `AppError(message, statusCode)` in services.
- **Auth:** `verifyToken` middleware checks JWT, attaches `req.user` (full Sequelize model with `Role` included). `requireRoles(...roles)` checks `req.user.Role.nombre_rol`.
- **Validation:** Zod schemas in route files + `validateSchema` middleware. Also `express-validator` available.
- **Responses:** Consistent `{ status: 'success'|'fail'|'error', data?, message? }` shape.
- **Model files:** Use `tableName` option (plural snake_case). Timestamps and paranoid are per-model.
- **`no-console` is an ESLint warning** — use `console.error` for errors, avoid `console.log` in production code.

## Express 5 + multer v2 Quirks

- `multer-storage-cloudinary` v4 is **incompatible** with multer v2. Profile photo upload uses disk storage + manual Cloudinary upload in the service layer. See `src/middleware/uploadMiddleware.js` and `auth.service.js:subirFotoPerfil`.
- The `/api/auth/me/foto` route is registered as an `app.post()` in `server.js` **before** `app.use('/api/auth', authRoutes)` to avoid nested-router issues in Express 5.

## Database

- **Production:** PostgreSQL via `DATABASE_URL` (Neon) with SSL (`rejectUnauthorized: false`).
- **Test:** SQLite in-memory (auto-detected via `NODE_ENV=test`). Tests call `sequelize.sync({ force: true })` in `beforeAll`.
- Pool: max 5, min 0, acquire 30s.
- Startup runs `sequelize.sync()` + manual `ALTER TABLE` migrations for columns added after initial sync (`server.js:migrateTablas`).
- **Soft delete gotcha:** If a model has `paranoid: true`, the `deleted_at` column must exist in PostgreSQL or queries crash with 500. `sequelize.sync()` creates it, but manual `ALTER TABLE` may be needed for existing tables.

## CORS

Allowed origins: `FRONTEND_URL` env var, `http://localhost:5173`, `http://localhost:3000`. Credentials enabled.

## Environment

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (default `1d`), `FRONTEND_URL`, SMTP for email, Cloudinary credentials (already in example).

`.npmrc` has `legacy-peer-deps=true` — preserve this if changing dependencies.

## ⚠️ Seguridad: Tests contra BD real

**NUNCA ejecute `npm test` sin `NODE_ENV=test`.** Los tests usan `sequelize.sync({ force: true })` que **borra todas las tablas** de la base de datos a la que apunte Sequelize.

El comando `npm test` usa `cross-env NODE_ENV=test` para proteger la BD real. Sin embargo, `cross-env` puede fallar en Windows/PowerShell. Por eso existe `npm run test:win` que usa la sintaxis nativa de PowerShell.

Además se agregaron dos capas de seguridad:
1. **`jest.setup.js`** — Lanza un error si `NODE_ENV !== 'test'` antes de ejecutar cualquier test.
2. **`src/config/db.js`** — Lanza un error si `NODE_ENV` no está definido al intentar conectar a PostgreSQL.

Si necesita ejecutar tests localmente en Windows:
```powershell
npm run test:win
# o manualmente:
$env:NODE_ENV="test"; npx jest --detectOpenHandles --forceExit
```

## Sibling Frontend

Located at `../Fronted-Panel-Admin-Mavet/` — React + TypeScript + Vite, axios instance configured with `VITE_API_URL` env var, token injected via interceptor. The photo upload endpoint sends FormData with field `"foto"` without explicit Content-Type.

## Test Patterns

- 7 integration test files in `tests/integration/`. Each seeds its own data via `sequelize.sync({ force: true })` + model creates.
- Uses `supertest` against the Express app (`require('../../src/server')`).
- Run single test: `npx jest tests/integration/auth.test.js`.
