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
 * Change password validation rules
 */
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Momentální heslo je povinné'),
  body('newPassword')
    .notEmpty()
    .withMessage('Nové heslo je povinné')
    .isLength({ min: 8 })
    .withMessage('Nové heslo musí mít minimálně 8 znaků')
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
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // From authenticateToken middleware

  // Get user from database
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw new AppError('Uživatel nebyl nalezen', 404);
  }

  // Check if user has a password (might be Google OAuth only)
  if (!user.password) {
    throw new AppError('Tento uživatel používá Google přihlášení, nemá zde uložené heslo', 400);
  }

  // Verify old password
  const { comparePassword: comparePwd, hashPassword: hashPwd } = require('../utils/password');
  const isOldPasswordValid = await comparePwd(oldPassword, user.password);
  
  if (!isOldPasswordValid) {
    throw new AppError('Momentální heslo je špatně', 401);
  }

  // Hash new password
  const hashedNewPassword = await hashPwd(newPassword);

  // Update password in database
  await userRepository.update(userId, { password: hashedNewPassword });

  res.json({
    success: true,
    message: 'Heslo bylo úspěšně změněno'
  });
});

/**
 * Google OAuth initiation
 * GET /api/auth/google
 * Redirects to Google OAuth consent screen with account selection prompt
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
  prompt: 'select_account'
});

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
  const { state } = req.query;
  const isMobileRequest = detectMobileRequest(req, state);

  if (isMobileRequest) {
    // For mobile apps, use custom scheme redirect
    const mobileScheme = process.env.MOBILE_APP_SCHEME || 'myapp';
    return res.redirect(`${mobileScheme}://auth/callback?token=${token}&success=true`);
  }

  // For web applications, redirect to login page with token
  const webOrigin = process.env.CORS_ORIGIN;
  return res.redirect(`${webOrigin}/pages/login.html?token=${token}`);
};

/**
 * Handles OAuth authentication errors
 * Determines redirect based on client type (web/mobile)
 */
const handleAuthError = (req, res, errorMessage) => {
  const { state } = req.query;
  const isMobileRequest = detectMobileRequest(req, state);
  const encodedError = encodeURIComponent(errorMessage);

  if (isMobileRequest) {
    // For mobile apps, use custom scheme redirect with error
    const mobileScheme = process.env.MOBILE_APP_SCHEME || 'myapp';
    return res.redirect(`${mobileScheme}://auth/callback?error=${encodedError}&success=false`);
  }

  // For web applications, redirect to login page with error
  const webOrigin = process.env.CORS_ORIGIN;
  return res.redirect(`${webOrigin}/pages/login.html?error=${encodedError}`);
};

/**
 * Detects if the request comes from a mobile application
 * Uses multiple detection methods for reliability
 */
const detectMobileRequest = (req, state) => {
  // Method 1: Check state parameter for mobile indicator
  if (state && state.includes('mobile')) {
    return true;
  }

  // Method 2: Check User-Agent for mobile patterns
  const userAgent = req.get('User-Agent') || '';
  const mobilePatterns = [
    /Mobile/i,
    /Android/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];

  if (mobilePatterns.some(pattern => pattern.test(userAgent))) {
    return true;
  }

  // Method 3: Check custom header set by mobile app
  const clientType = req.get('X-Client-Type');
  if (clientType === 'mobile') {
    return true;
  }

  // Method 4: Check referer for mobile app indicators
  const referer = req.get('Referer') || '';
  if (referer.includes('mobile') || referer.includes('app')) {
    return true;
  }

  return false;
};

module.exports = {
  login,
  loginValidation,
  logout,
  changePassword,
  changePasswordValidation,
  googleAuth,
  googleAuthCallback,
  handleAuthSuccess,
  handleAuthError,
  detectMobileRequest
};
