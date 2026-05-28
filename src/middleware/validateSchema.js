const validateZod = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    next(error); // Pasa el error de Zod al errorHandler global
  }
};

module.exports = validateZod;
