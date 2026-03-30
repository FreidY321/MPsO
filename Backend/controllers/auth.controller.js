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
    .withMessage('Je potřeba zadat validní emailovou adresu.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty()
    .withMessage('Heslo je povinné.')
];

/**
 * Login endpoint
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    throw new AppError('Neplatné heslo nebo email', 401);
  }

  // Check if user has a password (might be Google OAuth only)
  if (!user.password) {
    throw new AppError('Tento účet používá Google login, prosím použij ho', 401);
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Neplatné heslo nebo email', 401);
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
    message: 'Přihlášení proběhlo úspěšně',
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
  res.json({
    success: true,
    message: 'Odhlášení proběhlo úspěšně. Please remove the token from client storage.'
  });
});

/**
 * Google OAuth initiation
 * GET /api/auth/google
 * Redirects to Google OAuth consent screen with account selection prompt
 * Supports isMobileRequest parameter to determine redirect after auth
 */
const googleAuth = (req, res, next) => {
  const { isMobileRequest } = req.query;
  
  // Store isMobileRequest directly in state parameter as string
  const state = isMobileRequest === 'true' ? 'mobile' : 'web';
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    state
  })(req, res, next);
};

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 * Handles the callback from Google OAuth
 * Supports both web and mobile applications
 */
const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      return handleAuthError(req, res, err.message || 'Google autentizace selhala');
    }

    if (!user) {
      return handleAuthError(req, res, 'Autentizace selhala. Prosím, zkus to znovu.');
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

      // Handle successful authentication
      return handleAuthSuccess(req, res, token, user);
    } catch (error) {
      return handleAuthError(req, res, 'Nepodařilo se vygenerovat autentizační token');
    }
  })(req, res, next);
};

/**
 * Handles successful OAuth authentication
 * Determines redirect based on client type (web/mobile)
 */
const handleAuthSuccess = (req, res, token, user) => {
  // Check isMobileRequest from state parameter
  const { state } = req.query;
  const isMobileRequest = state === "mobile";

  if (isMobileRequest) {
    const mobileScheme = process.env.MOBILE_APP_SCHEME || 'myapp';
    return res.redirect(`${mobileScheme}://auth/callback?token=${token}&success=true`);
  }

  const webOrigin = process.env.CORS_ORIGIN;
  return res.redirect(`${webOrigin}/pages/login.html?token=${token}`);
};

/**
 * Handles OAuth authentication errors
 * Determines redirect based on client type (web/mobile)
 */
const handleAuthError = (req, res, errorMessage) => {
  // Check isMobileRequest from state parameter
  const { state } = req.query;
  const isMobileRequest = state === "mobile";
  const encodedError = encodeURIComponent(errorMessage);

  if (isMobileRequest) {
    const mobileScheme = process.env.MOBILE_APP_SCHEME || 'myapp';
    return res.redirect(`${mobileScheme}://auth/callback?error=${encodedError}&success=false`);
  }

  const webOrigin = process.env.CORS_ORIGIN;
  return res.redirect(`${webOrigin}/pages/login.html?error=${encodedError}`);
};

module.exports = {
  login,
  loginValidation,
  logout,
  googleAuth,
  googleAuthCallback,
  handleAuthSuccess,
  handleAuthError
};
