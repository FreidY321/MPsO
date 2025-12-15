const { body, validationResult } = require('express-validator');
const passport = require('passport');
const UserRepository = require('../repositories/UserRepository');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const userRepository = new UserRepository();

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Login endpoint
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user has a password (might be Google OAuth only)
  if (!user.password) {
    throw new AppError('This account uses Google sign-in. Please use Google OAuth to login.', 401);
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // If user is a student with a class, fetch class name
  let userData = { ...user };
  if (user.role === 'student' && user.class_id) {
    const ClassRepository = require('../repositories/ClassRepository');
    const classRepository = new ClassRepository();
    const classData = await classRepository.findById(user.class_id);
    if (classData) {
      userData.class_name = classData.name;
    }
  }

  // Generate JWT token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    classId: user.class_id
  };

  const token = generateToken(tokenPayload);

  // Return user data (without password) and token
  const { password: _, ...userWithoutPassword } = userData;

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

/**
 * Logout endpoint
 * POST /api/auth/logout
 * Note: JWT tokens are stateless, so logout is handled client-side by removing the token
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // The client should remove the token from storage
  // We just return a success message
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

/**
 * Change password validation rules
 */
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .notEmpty()
    .withMessage('New password is required')
];

/**
 * Change password endpoint
 * POST /api/auth/change-password
 * Requires authentication
 */
const changePassword = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // From authenticateToken middleware

  // Get user from database
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user has a password (might be Google OAuth only)
  if (!user.password) {
    throw new AppError('This account uses Google sign-in and does not have a password.', 400);
  }

  // Verify old password
  const { comparePassword: comparePwd, hashPassword: hashPwd } = require('../utils/password');
  const isOldPasswordValid = await comparePwd(oldPassword, user.password);
  
  if (!isOldPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedNewPassword = await hashPwd(newPassword);

  // Update password in database
  await userRepository.update(userId, { password: hashedNewPassword });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Google OAuth initiation
 * GET /api/auth/google
 * Redirects to Google OAuth consent screen
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 * Handles the callback from Google OAuth
 */
const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      // Redirect to login page with error
      const errorMessage = encodeURIComponent(err.message || 'Google authentication failed');
      return res.redirect(`${process.env.CORS_ORIGIN}/pages/login.html?error=${errorMessage}`);
    }

    if (!user) {
      const errorMessage = encodeURIComponent('Authentication failed. Please try again.');
      return res.redirect(`${process.env.CORS_ORIGIN}/pages/login.html?error=${errorMessage}`);
    }

    try {
      // Generate JWT token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        classId: user.class_id
      };

      const token = generateToken(tokenPayload);

      // Redirect to frontend with token
      // The frontend will extract the token from URL and store it
      res.redirect(`${process.env.CORS_ORIGIN}/pages/login.html?token=${token}`);
    } catch (error) {
      const errorMessage = encodeURIComponent('Failed to generate authentication token');
      return res.redirect(`${process.env.CORS_ORIGIN}/pages/login.html?error=${errorMessage}`);
    }
  })(req, res, next);
};

module.exports = {
  login,
  loginValidation,
  logout,
  changePassword,
  changePasswordValidation,
  googleAuth,
  googleAuthCallback
};
