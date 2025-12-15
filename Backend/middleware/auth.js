const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 * Adds user data to req.user if valid
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(error.message || 'Invalid or expired token', 401));
    }
  }
};

/**
 * Middleware to authorize user based on role
 * Must be used after authenticateToken middleware
 * @param {string|Array<string>} allowedRoles - Role(s) allowed to access the route
 */
const authorizeRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('You do not have permission to access this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
