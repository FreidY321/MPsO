const express = require('express');
const router = express.Router();
const { 
  login, 
  loginValidation, 
  logout, 
  changePasswordValidation,
  googleAuth,
  googleAuthCallback
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.get('/google/callback', googleAuthCallback);

module.exports = router;
