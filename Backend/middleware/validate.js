const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Validation middleware
 * Checks for validation errors from express-validator and throws AppError if any exist
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    throw new AppError('Validation failed', 400, errorMessages);
  }
  
  next();
};

module.exports = validate;
