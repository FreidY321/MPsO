const { body, param, query, validationResult } = require('express-validator');
const BookRepository = require('../repositories/BookRepository');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const bookRepository = new BookRepository();

/**
 * Get all books with optional filters
 * GET /api/books?literary_class=1&period=2&author_id=3
 */
const getAllBooks = asyncHandler(async (req, res) => {
  const { literary_class, period, author_id } = req.query;

  // Build filters object
  const filters = {};
  if (literary_class) filters.literary_class = parseInt(literary_class);
  if (period) filters.period = parseInt(period);
  if (author_id) filters.author_id = parseInt(author_id);

  // Get books with filters
  const books = Object.keys(filters).length > 0
    ? await bookRepository.findByFilters(filters)
    : await bookRepository.findAll();

  res.json({
    success: true,
    count: books.length,
    data: books
  });
});

/**
 * Get book by ID
 * GET /api/books/:id
 */
const getBookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await bookRepository.findById(id);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  res.json({
    success: true,
    data: book
  });
});

/**
 * Create book validation rules
 */
const createBookValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Book name is required'),
  body('url_book')
    .trim()
    .notEmpty()
    .withMessage('Book URL is required')
    .isURL()
    .withMessage('Book URL must be a valid URL'),
  body('author_id')
    .isInt({ min: 1 })
    .withMessage('Author ID must be a positive integer'),
  body('translator_name')
    .optional()
    .trim(),
  body('period')
    .isInt({ min: 1 })
    .withMessage('Period ID must be a positive integer'),
  body('literary_class')
    .isInt({ min: 1 })
    .withMessage('Literary class ID must be a positive integer')
];

/**
 * Create a new book (admin only)
 * POST /api/books
 */
const createBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { name, url_book, author_id, translator_name, period, literary_class } = req.body;

  // Create book data object
  const bookData = {
    name,
    url_book,
    author_id,
    period,
    literary_class
  };

  // Add optional translator_name
  if (translator_name) {
    bookData.translator_name = translator_name;
  }

  // Create book
  const newBook = await bookRepository.create(bookData);

  // Get full book details with joined data
  const createdBook = await bookRepository.findById(newBook.id);

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: createdBook
  });
});

/**
 * Update book validation rules
 */
const updateBookValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Book name cannot be empty'),
  body('url_book')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Book URL cannot be empty')
    .isURL()
    .withMessage('Book URL must be a valid URL'),
  body('author_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Author ID must be a positive integer'),
  body('translator_name')
    .optional()
    .trim(),
  body('period')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Period ID must be a positive integer'),
  body('literary_class')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Literary class ID must be a positive integer')
];

/**
 * Update book (admin only)
 * PUT /api/books/:id
 */
const updateBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if book exists
  const existingBook = await bookRepository.findById(id);
  if (!existingBook) {
    throw new AppError('Book not found', 404);
  }

  // Update book
  const updated = await bookRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Failed to update book', 500);
  }

  // Get updated book with full details
  const updatedBook = await bookRepository.findById(id);

  res.json({
    success: true,
    message: 'Book updated successfully',
    data: updatedBook
  });
});

/**
 * Delete book (admin only)
 * DELETE /api/books/:id
 */
const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if book exists
  const book = await bookRepository.findById(id);
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  // Check if book is used in any reading lists
  const isUsed = await bookRepository.isUsedInReadingLists(id);
  if (isUsed) {
    throw new AppError('Cannot delete book that is in use in reading lists', 400);
  }

  // Delete book
  const deleted = await bookRepository.delete(id);

  if (!deleted) {
    throw new AppError('Failed to delete book', 500);
  }

  res.json({
    success: true,
    message: 'Book deleted successfully'
  });
});

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  createBookValidation,
  updateBook,
  updateBookValidation,
  deleteBook
};
