const redis = require('../config/redis');

const DEFAULT_TTL = 300;

let habilitado = false;

// ---- Fallback en memoria cuando Redis no está disponible ----
const memCache = new Map();

function memGet(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSeconds) {
  memCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
}

function memDel(key) {
  memCache.delete(key);
}

function memClear(pattern) {
  const prefix = pattern.replace(/\*/g, '');
  for (const key of memCache.keys()) {
    if (key.startsWith(prefix)) {
      memCache.delete(key);
    }
  }
}

// Limpieza periódica de entradas expiradas en memoria
/* global setInterval */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memCache) {
    if (now > entry.expiry) memCache.delete(key);
  }
}, 60_000);
// ---- Fin fallback en memoria ----

async function inicializar() {
  if (!redis) {
    habilitado = false;
    return;
  }
  try {
    await redis.connect();
    habilitado = true;
  } catch {
    habilitado = false;
  }
}

function deshabilitar() {
  habilitado = false;
}

function estaHabilitado() {
  return habilitado || true; // Siempre habilitado (Redis o memoria)
}

function generarClave(...partes) {
  return `mavet:${partes.join(':')}`;
}

async function obtener(key) {
  if (habilitado) {
    try {
      const valor = await redis.get(key);
      if (valor) return JSON.parse(valor);
    } catch {
      // fallback a memoria
    }
  }
  return memGet(key);
}

async function guardar(key, value, ttlSeconds = DEFAULT_TTL) {
  if (habilitado) {
    try {
      const serializado = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redis.setex(key, ttlSeconds, serializado);
      } else {
        await redis.set(key, serializado);
      }
      return;
    } catch {
      // fallback a memoria
    }
  }
  memSet(key, value, ttlSeconds);
}

async function eliminar(key) {
  memDel(key);
  if (!habilitado) return;
  try {
    await redis.del(key);
  } catch {
    // ignorar
  }
}

async function eliminarPatron(pattern) {
  memClear(pattern);
  if (!habilitado) return;
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    let keysCount = 0;

    stream.on('data', (keys) => {
      if (keys.length) {
        keys.forEach((k) => pipeline.del(k));
        keysCount += keys.length;
      }
    });

    await new Promise((resolve, reject) => {
      stream.on('end', async () => {
        if (keysCount > 0) {
          try {
            await pipeline.exec();
          } catch {
            // ignorar
          }
        }
        resolve();
      });
      stream.on('error', reject);
    });
  } catch {
    // ignorar
  }
}

async function wrap(key, ttlSeconds, fn) {
  const cached = await obtener(key);
  if (cached !== null) return cached;

  const result = await fn();
  if (result !== null && result !== undefined) {
    await guardar(key, result, ttlSeconds);
  }
  return result;
}

module.exports = {
  inicializar,
  deshabilitar,
  estaHabilitado,
  generarClave,
  obtener,
  guardar,
  eliminar,
  eliminarPatron,
  wrap,
  DEFAULT_TTL,
};
