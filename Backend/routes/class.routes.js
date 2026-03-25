const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  getClassDeadline,
  createClass,
  createClassValidation,
  updateClass,
  updateClassValidation,
  deleteClass
} = require('../controllers/class.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/classes
 * @desc    Get all classes
 * @access  Private (admin, teacher)
 */
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllClasses);

/**
 * @route   GET /api/classes/:id
 * @desc    Get class by ID with students
 * @access  Private (admin, teacher)
 */
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getClassById);

/**
 * @route   GET /api/classes/:id/deadline
 * @desc    Get class deadline by ID
 * @access  Private (admin, teacher, student)
 */
router.get('/:id/deadline', authenticateToken, getClassDeadline);

/**
 * @route   POST /api/classes
 * @desc    Create a new class
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, authorizeRole('admin'), createClassValidation, createClass);

/**
 * @route   PUT /api/classes/:id
 * @desc    Update class (admin can update all fields, teacher can only update deadline for classes where they teach)
 * @access  Private (admin, teacher only)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), updateClassValidation, updateClass);

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete class
 * @access  Private (admin only)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteClass);

module.exports = router;
