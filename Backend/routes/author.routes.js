const express = require('express');
const router = express.Router();
const {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  createAuthorValidation,
  updateAuthor,
  updateAuthorValidation,
  deleteAuthor
} = require('../controllers/author.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/authors
 * @desc    Get all authors
 * @access  Private (admin, teacher, student)
 */
router.get('/', authenticateToken, getAllAuthors);

/**
 * @route   GET /api/authors/:id
 * @desc    Get author by ID
 * @access  Private (admin, teacher, student)
 */
router.get('/:id', authenticateToken, getAuthorById);

/**
 * @route   POST /api/authors
 * @desc    Create a new author
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, authorizeRole('admin'), createAuthorValidation, createAuthor);

/**
 * @route   PUT /api/authors/:id
 * @desc    Update author
 * @access  Private (admin only)
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), updateAuthorValidation, updateAuthor);

/**
 * @route   DELETE /api/authors/:id
 * @desc    Delete author
 * @access  Private (admin only)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteAuthor);

module.exports = router;
