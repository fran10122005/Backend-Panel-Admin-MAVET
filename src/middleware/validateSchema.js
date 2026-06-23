const validateZod = (schema) => (req, res, next) => {
  try {
    // Si pasaron un esquema de Zod directo, asumimos que es para el req.body (para no romper el código viejo)
    if (schema.shape || schema._def) {
      schema.parse(req.body);
    } else {
      // Si pasaron un objeto { body, query, params }, validamos lo que exista
      if (schema.body) schema.body.parse(req.body);
      if (schema.query) schema.query.parse(req.query);
      if (schema.params) schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    next(error); // Pasa el error de Zod al errorHandler global
  }
};

module.exports = validateZod;
