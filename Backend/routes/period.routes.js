const express = require('express');
const router = express.Router();
const {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  createPeriodValidation,
  updatePeriod,
  updatePeriodValidation,
  deletePeriod
} = require('../controllers/period.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/periods
 * @desc    Get all periods
 * @access  Private (admin, teacher, student)
 */
router.get('/', authenticateToken, getAllPeriods);

/**
 * @route   GET /api/periods/:id
 * @desc    Get period by ID
 * @access  Private (admin, teacher, student)
 */
router.get('/:id', authenticateToken, getPeriodById);

/**
 * @route   POST /api/periods
 * @desc    Create a new period
 * @access  Private (admin, teacher only)
 */
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), createPeriodValidation, createPeriod);

/**
 * @route   PUT /api/periods/:id
 * @desc    Update period
 * @access  Private (admin, teacher only)
 */
router.put('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), updatePeriodValidation, updatePeriod);

/**
 * @route   DELETE /api/periods/:id
 * @desc    Delete period
 * @access  Private (admin, teacher only)
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), deletePeriod);

module.exports = router;
