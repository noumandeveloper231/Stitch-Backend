const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.details = error.details.map((d) => d.message);
    return next(err);
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.details = error.details.map((d) => d.message);
    return next(err);
  }
  req.query = value;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.details = error.details.map((d) => d.message);
    return next(err);
  }
  req.params = value;
  next();
};

module.exports = { validateBody, validateQuery, validateParams };
