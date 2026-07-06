# Plan de Implementación — Subida de Fotos con Cloudinary

## Arquitectura Actual

Todas las subidas de imágenes siguen el mismo patrón:

```
Cliente (FormData) → Multer (disco) → Cloudinary upload → BD (secure_url) → Limpieza archivo temp
```

### Middleware compartido: `src/middleware/uploadMiddleware.js`

- Almacenamiento en disco: `public/uploads/`
- Límite: 5 MB
- Solo imágenes (image/*)
- Nombre generado: `file_{timestamp}_{random}{ext}`

### Configuración Cloudinary: `src/config/cloudinary.js`

```js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

---

## Implementación por Módulo

### 1. Obras — `POST /api/obras/` y `PUT /api/obras/:id`

| Componente | Archivo | Detalle |
|---|---|---|
| Route | `src/modules/obras/routes/obra.routes.js` | `upload.single('imagen')` |
| Controller | `src/modules/obras/controllers/obra.controller.js` | Lógica completa en el controlador |
| Service | `src/modules/obras/services/obra.service.js` | Sin lógica Cloudinary |
| Model | `src/modules/obras/models/Obra.model.js` | `imagen_url STRING(255)` |
| Folder Cloudinary | `mavet_uploads` | |

**Código en controlador (`createObra` / `updateObra`):**
```js
if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'mavet_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
  });
  data.imagen_url = result.secure_url;
  // finally: fs.unlinkSync(req.file.path)
}
```

### 2. Auth (Foto de perfil) — `POST /api/auth/me/foto`

| Componente | Archivo | Detalle |
|---|---|---|
| Route | `src/server.js` (app.post directo) + `src/modules/auth/routes/auth.routes.js` | `upload.single('foto')` |
| Controller | `src/modules/auth/controllers/auth.controller.js` | `subirFoto` → llama al service |
| Service | `src/modules/auth/services/auth.service.js` | `subirFotoPerfil` — lógica Cloudinary |
| Model | `src/modules/auth/models/Usuario.model.js` | `foto_url STRING(500)` |
| Folder Cloudinary | `mavet_uploads` | |
| Sincronización | Actualiza `foto_url` en `Usuario` y `Trabajador` asociado | |

**Código en service (`subirFotoPerfil`):**
```js
const result = await cloudinary.uploader.upload(filePath, {
  folder: 'mavet_uploads',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
});
url = result.secure_url;
// finally: fs.unlinkSync(filePath)
// Guarda en Usuario.foto_url y Trabajador.foto_url
```

### 3. RRHH (Foto de trabajador) — `POST /api/trabajadores/:id/foto`

| Componente | Archivo | Detalle |
|---|---|---|
| Route | `src/modules/rrhh/routes/trabajador.routes.js` | `upload.single('foto')` |
| Controller | `src/modules/rrhh/controllers/trabajador.controller.js` | `subirFoto` → llama al service |
| Service | `src/modules/rrhh/services/trabajador.service.js` | `subirFotoTrabajador` — lógica Cloudinary |
| Model | `src/modules/rrhh/models/Trabajador.model.js` | `foto_url STRING(500)` |
| Folder Cloudinary | `mavet_trabajadores` | |
| Sincronización | Actualiza `foto_url` en `Trabajador` y `Usuario` asociado | |

---

## Diferencias entre módulos

| Aspecto | Obras | Auth (perfil) | RRHH (trabajador) |
|---|---|---|---|
| Dónde se hace upload | Controller | Service | Service |
| Nombre del campo multer | `imagen` | `foto` | `foto` |
| Folder Cloudinary | `mavet_uploads` | `mavet_uploads` | `mavet_trabajadores` |
| Columna BD | `imagen_url` (255) | `foto_url` (500) | `foto_url` (500) |
| Sincroniza otra tabla | No | Sí → Trabajador | Sí → Usuario |

---

## Pasos para estandarizar / aplicar el patrón a nuevos módulos

1. **Agregar campo en el modelo** → tipo `DataTypes.STRING(500)`, `allowNull: true`
2. **Agregar migración** en `server.js:migrateTablas` con `ALTER TABLE ADD COLUMN IF NOT EXISTS`
3. **Usar uploadMiddleware** → `upload.single('nombreCampo')` en la ruta
4. **Implementar upload en controller o service**:
   ```js
   const cloudinary = require('../../config/cloudinary');
   const fs = require('fs');

   if (req.file) {
     try {
       const result = await cloudinary.uploader.upload(req.file.path, {
         folder: 'mavet_uploads',          // elegir folder según módulo
         allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
       });
       data.foto_url = result.secure_url;
     } catch (err) {
       throw new AppError('Error al procesar la imagen.', 500);
     } finally {
       try { fs.unlinkSync(req.file.path); } catch (_) {}
     }
   }
   ```
5. **Excluir campo de validación Zod** (lo maneja multer, no el body)
6. **Frontend** enviar `FormData` con el campo como `file`, **sin** `Content-Type` explícito

---

## Pendientes / Mejoras detectadas

- `Obra.model.js` usa `STRING(255)` para `imagen_url` — las URLs de Cloudinary pueden exceder esa longitud. Cambiar a `STRING(500)` como los demás modelos.
- `uploadMiddleware.js` tiene imports no usados (`CloudinaryStorage`, `cloudinary`) que son reliquia de `multer-storage-cloudinary` v4 (incompatible con multer v2). Limpiarlos.
- Ruta `POST /api/auth/me/foto` está registrada **dos veces** (`server.js` y `auth.routes.js`). Por ahora funciona porque `server.js` tiene prioridad, pero conviene eliminar la duplicación si Express 5 ya no presenta el problema de anidamiento.
- El controller de RRHH (`trabajador.controller.js`) tiene logging debug a archivo (`upload_debug.log`). Evaluar si removerlo en producción.
