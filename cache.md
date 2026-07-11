# Sistema de Caché con Redis

## Arquitectura

```
Cliente → Express → cacheMiddleware (GET) → Controlador → Servicio → BD
                         │                          │
                         ▼                          ▼
                    Redis (caché)         Servicio (invalida caché en
                                          create/update/delete)
```

El sistema se compone de 3 capas:

### 1. `src/config/redis.js` — Conexión
Configura `ioredis` usando la variable de entorno `REDIS_URL` (default `redis://localhost:6379`).  
En `NODE_ENV=test` se deshabilita automáticamente.  
Usa `lazyConnect` + `retryStrategy` (3 reintentos) para no bloquear el arranque si Redis no está disponible.

### 2. `src/services/cache.service.js` — Servicio
Capa de abstracción con operaciones seguras (nunca lanzan errores):

| Método | Descripción |
|---|---|
| `inicializar()` | Conecta con Redis, marca el servicio como habilitado |
| `obtener(key)` | Recupera valor parseado como JSON |
| `guardar(key, value, ttl?)` | Almacena con TTL opcional (default 300s) |
| `eliminar(key)` | Borra una clave específica |
| `eliminarPatron(pattern)` | Borra todas las claves que coincidan con un patrón (usa `SCAN` + pipeline) |
| `wrap(key, ttl, fn)` | Cache-aside: obtiene del caché o ejecuta `fn` y almacena el resultado |
| `generarClave(...partes)` | Genera clave con prefijo `mavet:` |
| `deshabilitar()` | Deshabilita el caché en caliente |
| `estaHabilitado()` | Indica si Redis está conectado y listo |

Todas las operaciones fallan silenciosamente si Redis no está corriendo — la aplicación sigue funcionando sin caché.

### 3. `src/middleware/cacheMiddleware.js` — Middleware Express

- **`cache(ttl)`**: Middleware para rutas GET. Antes de llegar al controlador, verifica si la respuesta ya está en Redis. Si está cacheada, la devuelve sin ejecutar el controlador. Si no, intercepta `res.json()` para guardar la respuesta después de que el controlador termine. Usa `.catch(next)` para propagar errores a Express 5.
- **`limpiarCache(...patrones)`**: Middleware para rutas mutantes (POST/PUT/DELETE). Acepta uno o más patrones glob y borra todas las claves que coincidan tras una respuesta exitosa.

## Endpoints cacheados

| Ruta | TTL | Propósito |
|---|---|---|
| `/api/public/obras` | 300s | Obras públicas (visitantes) |
| `/api/public/imagenes-web` | 600s | Banners y galería |
| `/api/public/agenda` | 300s | Talleres y eventos públicos |
| `/api/public/libros` | 300s | Biblioteca pública |
| `/api/obras/artistas` | 600s | Catálogo de artistas (selects) |
| `/api/obras/tecnicas` | 600s | Catálogo de técnicas (selects) |
| `/api/obras/estados` | 600s | Catálogo de estados (selects) |
| `/api/obras/categorias` | 600s | Catálogo de categorías (selects) |

## Invalidación automática

Cada vez que se ejecuta una mutación (crear, actualizar, eliminar) en los servicios, se invalida automáticamente el caché de los endpoints públicos afectados. Esto se hace dentro del propio archivo de servicio (`service.js`).

### Mapeo de invalidaciones

| Acción en el servicio | Patrones de caché que invalida |
|---|---|
| `obra.service.js` — create/update/delete | `mavet:resp:/api/public/obras*` |
| `artista.service.js` — create/update/delete | `mavet:resp:/api/obras/artistas*` + `/api/public/obras*` |
| `tecnicaObra.service.js` — create/update/delete | `mavet:resp:/api/obras/tecnicas*` + `/api/public/obras*` |
| `estadoObra.service.js` — create/update/delete | `mavet:resp:/api/obras/estados*` + `/api/public/obras*` |
| `categoriaObra.service.js` — create/update/delete | `mavet:resp:/api/obras/categorias*` + `/api/public/obras*` |
| `imagenWeb.service.js` — create/update/remove | `mavet:resp:/api/public/imagenes-web*` |
| `libro.service.js` — create/update/delete/devolver | `mavet:resp:/api/public/libros*` |
| `taller.service.js` — create/update/delete/planificar | `mavet:resp:/api/public/agenda*` |
| `solicitudEspacio.service.js` — create/update/delete | `mavet:resp:/api/public/agenda*` |

## Cómo usar el caché en servicios

### Cache manual (cache-aside)

Para cachear resultados de consultas dentro de un servicio sin afectar el middleware HTTP:

```js
const cacheService = require('../services/cache.service');

async function getLibrosDestacados() {
  return cacheService.wrap(
    cacheService.generarClave('libros', 'destacados'),
    300, // TTL en segundos
    () => Libro.findAll({ where: { destacado: true } })
  );
}
```

`wrap` primero intenta leer de Redis; si no encuentra, ejecuta la función, guarda el resultado en Redis y lo retorna.

### Cache de respuestas HTTP

Para cachear un endpoint GET nuevo, agrega el middleware `cache(ttl)` en `server.js` **antes** del handler:

```js
const { cache } = require('./middleware/cacheMiddleware');

app.get('/api/public/mi-ruta', cache(300), miControlador.metodo);
```

Solo aplica a respuestas `2xx`. Si el controlador responde con error, no se cachea.

### Invalidar desde middleware (`limpiarCache`)

Para invalidar patrones de caché desde rutas mutantes sin tocar el servicio:

```js
const { limpiarCache } = require('../middleware/cacheMiddleware');

router.post('/', limpiarCache('mavet:resp:/api/biblioteca/libros*'), miControlador.crear);
router.put('/:id', limpiarCache('mavet:resp:/api/biblioteca/libros*'), miControlador.actualizar);
router.delete('/:id', limpiarCache('mavet:resp:/api/biblioteca/libros*'), miControlador.eliminar);
```

Puedes pasar múltiples patrones en un solo `limpiarCache`:

```js
limpiarCache('mavet:resp:/api/obras/artistas*', 'mavet:resp:/api/public/obras*')
```

## Formato de claves en Redis

Todas las claves usan el formato:

```
mavet:resp:<url_completa>    → Respuestas HTTP cacheadas (con query string)
mavet:<modulo>:<id>          → Caché manual desde servicios
```

Ejemplos:
- `mavet:resp:/api/public/obras?page=1&limit=10`
- `mavet:resp:/api/obras/artistas`
- `mavet:libros:destacados`

## Configuración

En `.env`:

```env
REDIS_URL=redis://localhost:6379
```

Para Redis con contraseña:

```env
REDIS_URL=redis://:password@host:port
```

Para Redis en Unix socket:

```env
REDIS_URL=redis:///tmp/redis.sock
```

## Comportamiento en testing

En `NODE_ENV=test`:
- `redis = null` (nunca intenta conectar)
- `cacheService.inicializar()` se salta sin errores
- `cacheService.estaHabilitado()` retorna `false`
- Todos los métodos del servicio se convierten en no-op

## Casos borde y manejo de errores

| Situación | Comportamiento |
|---|---|
| Redis no está instalado/inaccesible al arrancar | `inicializar()` falla silenciosamente, `habilitado = false`. La app funciona sin caché |
| Redis se cae en medio de la operación | El `cache` middleware llama a `next()` sin cachear. Los servicios no lanzan error |
| Redis responde lentamente | `setex` y `get` tienen timeout implícito por `ioredis` (configurable) |
| El controlador lanza error 5xx | No se cachea (el middleware solo guarda respuestas 2xx) |
| La respuesta es muy grande | `JSON.stringify` puede fallar; el catch del `guardar` lo ignora |
| SCAN en Redis monte grande | Usa `count: 100` con pipeline; no bloquea el event loop |
| Múltiples mutaciones concurrentes | Cada una invalida el mismo patrón; es idempotente |

## Dependencia

`ioredis` — instalado como dependencia de producción.
