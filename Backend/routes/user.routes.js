const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  getAllUsers,
  getUserById,
  createUser,
  createUserValidation,
  updateUser,
  updateUserValidation,
  deleteUser,
  getStudentsByClass,
  resetPassword,
  bulkRegistration,
  bulkRegistrationValidation
} = require('../controllers/user.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (admin only)
 */
router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user's profile
 * @access  Private (any authenticated user)
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   GET /api/users/class/:classId
 * @desc    Get students by class ID
 * @access  Private (admin, teacher)
 */
router.get('/class/:classId', authenticateToken, authorizeRole(['admin', 'teacher']), getStudentsByClass);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (authenticated users can view their own profile, admin can view all)
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * @route   POST /api/users/bulk
 * @desc    Bulk registration of students
 * @access  Private (admin only)
 */
router.post('/bulk', authenticateToken, authorizeRole('admin'), bulkRegistrationValidation, bulkRegistration);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, authorizeRole('admin'), createUserValidation, createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin)
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), updateUserValidation, updateUser);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (admin only)
 */
router.post('/:id/reset-password', authenticateToken, authorizeRole('admin'), resetPassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteUser);

module.exports = router;
