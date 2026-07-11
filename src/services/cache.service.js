const redis = require('../config/redis');

const DEFAULT_TTL = 300;

let habilitado = false;

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
  return habilitado;
}

function generarClave(...partes) {
  return `mavet:${partes.join(':')}`;
}

async function obtener(key) {
  if (!habilitado) return null;
  try {
    const valor = await redis.get(key);
    if (!valor) return null;
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

async function guardar(key, value, ttlSeconds = DEFAULT_TTL) {
  if (!habilitado) return;
  try {
    const serializado = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, serializado);
    } else {
      await redis.set(key, serializado);
    }
  } catch {
    // Redis caído, ignorar
  }
}

async function eliminar(key) {
  if (!habilitado) return;
  try {
    await redis.del(key);
  } catch {
    // Redis caído, ignorar
  }
}

async function eliminarPatron(pattern) {
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
    // Redis caído, ignorar
  }
}

async function wrap(key, ttlSeconds, fn) {
  if (!habilitado) return fn();

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
