const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  let status  = err.statusCode || 500;
  let message = err.message    || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    status  = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    status  = 409;
    message = `Duplicate: ${Object.keys(err.keyValue).join(', ')} already exists`;
  }
  if (err.name === 'CastError') {
    status  = 400;
    message = `Invalid ID format`;
  }

  logger.error(`${status} ${message} [${req.method} ${req.originalUrl}]`);
  res.status(status).json({ success: false, message });
};
