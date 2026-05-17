const ApiError = require('../Error/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }

  // Mongoose – bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(`Resource not found with id: ${err.value}`, 404);
  }

  // Mongoose – duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(`Duplicate value for field: ${field}`, 409);
  }

  // Mongoose – validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(messages.join('. '), 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Token expired. Please log in again.', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;