const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  createBookValidation,
  updateBook,
  updateBookValidation,
  deleteBook
} = require('../controllers/book.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   GET /api/books
 * @desc    Get all books with optional filters (literary_class, period, author_id)
 * @access  Private (admin, teacher, student)
 */
router.get('/', authenticateToken, getAllBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID with author details
 * @access  Private (admin, teacher, student)
 */
router.get('/:id', authenticateToken, getBookById);

/**
 * @route   POST /api/books
 * @desc    Create a new book
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, authorizeRole('admin'), createBookValidation, createBook);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book
 * @access  Private (admin only)
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), updateBookValidation, updateBook);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book
 * @access  Private (admin only)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteBook);

module.exports = router;
