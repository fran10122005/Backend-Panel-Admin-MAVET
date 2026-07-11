const cacheService = require('../services/cache.service');

function cache(ttlSeconds) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (!cacheService.estaHabilitado()) return next();

    const key = cacheService.generarClave('resp', req.originalUrl);

    cacheService
      .obtener(key)
      .then((cached) => {
        if (cached !== null) {
          return res.status(200).json(cached);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheService.guardar(key, body, ttlSeconds);
          }
          originalJson(body);
        };

        next();
      })
      .catch(next);
  };
}

function limpiarCache(...patrones) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const patron of patrones) {
          cacheService.eliminarPatron(patron);
        }
      }
      originalJson(body);
    };
    next();
  };
}

module.exports = { cache, limpiarCache };
