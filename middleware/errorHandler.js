module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  const details = err.details || undefined;

  if (process.env.NODE_ENV !== "production" && status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
};
