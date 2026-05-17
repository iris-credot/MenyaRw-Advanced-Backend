const ApiError = require('./ApiError');

class BadRequest extends ApiError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFound extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

module.exports = { BadRequest, UnauthorizedError, ForbiddenError, NotFound, ConflictError };