const express = require('express');
const router = express.Router();
const {
  getAllLiteraryClasses,
  getLiteraryClassById,
  createLiteraryClass,
  createLiteraryClassValidation,
  updateLiteraryClass,
  updateLiteraryClassValidation,
  deleteLiteraryClass
} = require('../controllers/literaryClass.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/literary-classes
 * @desc    Get all literary classes
 * @access  Private (admin, teacher, student)
 */
router.get('/', authenticateToken, getAllLiteraryClasses);

/**
 * @route   GET /api/literary-classes/:id
 * @desc    Get literary class by ID
 * @access  Private (admin, teacher, student)
 */
router.get('/:id', authenticateToken, getLiteraryClassById);

/**
 * @route   POST /api/literary-classes
 * @desc    Create a new literary class
 * @access  Private (admin, teacher only)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), createLiteraryClassValidation, createLiteraryClass);

/**
 * @route   PUT /api/literary-classes/:id
 * @desc    Update literary class
 * @access  Private (admin, teacher only)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), updateLiteraryClassValidation, updateLiteraryClass);

/**
 * @route   DELETE /api/literary-classes/:id
 * @desc    Delete literary class
 * @access  Private (admin, teacher only)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), deleteLiteraryClass);

module.exports = router;
