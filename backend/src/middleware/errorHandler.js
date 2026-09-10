const { AppError } = require('../utils/helpers');
const config = require('../config');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || message;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier provided';
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    message = 'A record with this value already exists';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Authentication token is invalid';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  if (
    err.name === 'MongooseError' &&
    /buffering timed out/i.test(err.message || '')
  ) {
    statusCode = 503;
    code = 'DB_UNAVAILABLE';
    message =
      'Database is not connected. Check Render MONGODB_URI and Atlas Network Access (allow 0.0.0.0/0).';
  }

  if (err.name === 'MongoServerSelectionError') {
    statusCode = 503;
    code = 'DB_UNAVAILABLE';
    message =
      'Cannot reach MongoDB Atlas. Allow Render IPs in Atlas Network Access (0.0.0.0/0) and verify MONGODB_URI.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message = err.message;
  }

  const payload = {
    success: false,
    error: {
      code,
      message:
        statusCode >= 500 && config.nodeEnv === 'production'
          ? 'An unexpected error occurred'
          : message,
    },
  };

  if (err.details) {
    payload.error.details = err.details;
  }

  if (config.nodeEnv !== 'production' && statusCode >= 500) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
