const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  logger.error("Unhandled request error", {
    status,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Internal Server Error"
        : err.message || "Request failed",
  });
};