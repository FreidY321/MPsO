/**
 * Custom error class for application errors
 * Extends the built-in Error class with statusCode
 */
class AppError extends Error {
  constructor(message, statusCode, validationErrors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.validationErrors = validationErrors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
