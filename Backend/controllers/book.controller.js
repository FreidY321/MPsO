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
    throw new AppError('Kniha nebyla nalezena', 404);
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
    .withMessage('Jméno knihy je povinné.'),
  body('url_book')
    .trim()
    .optional({values: 'null'})
    .isURL()
    .withMessage('URL knížky musí být validní URL.'),
  body('author_id')
    .isInt({ min: 1 })
    .withMessage('ID autora musí být přirozené číslo.'),
  body('translator_name')
    .optional()
    .trim(),
  body('period')
    .isInt({ min: 1 })
    .withMessage('ID období musí být přirozené číslo.'),
  body('literary_class')
    .isInt({ min: 1 })
    .withMessage('ID literárního druhu musí být přirozené číslo.')
];

/**
 * Create a new book (admin, teachers only)
 * POST /api/books
 */
const createBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { name, url_book, author_id, translator_name, period, literary_class } = req.body;

  // Create book data object
  const bookData = {
    name,
    author_id,
    period,
    literary_class
  };

  // Add optional translator_name
  if (translator_name) {
    bookData.translator_name = translator_name;
  }
  
  if(url_book){
    bookData.url_book = url_book;
  } 

  // Create book
  const newBook = await bookRepository.create(bookData);

  // Get full book details with joined data
  const createdBook = await bookRepository.findById(newBook.id);

  res.status(201).json({
    success: true,
    message: 'Kniha byla úspěšně vytvořena',
    data: createdBook
  });
});

/**
 * Update book validation rules
 */
const updateBookValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID knihy musí být přirozené číslo.'),
  body('name')
    .optional({values: 'null'})
    .trim()
    .notEmpty()
    .withMessage('Jméno knihy je povinné.'),
  body('url_book')
    .trim()
    .optional({values: 'null'})
    .isURL()
    .withMessage('URL knížky musí být validní URL.'),
  body('author_id')
    .optional({values: 'null'})
    .isInt({ min: 1 })
    .withMessage('ID autora musí být přirozené číslo.'),
  body('translator_name')
    .optional()
    .trim(),
  body('period')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID období musí být přirozené číslo.'),
  body('literary_class')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID literárního druhu musí být přirozené číslo.')
];

/**
 * Update book (admin, teachers only)
 * PUT /api/books/:id
 */
const updateBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if book exists
  const existingBook = await bookRepository.findById(id);
  if (!existingBook) {
    throw new AppError('Kniha nebyla nalezena', 404);
  }

  // Update book
  const updated = await bookRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Nepodařilo se upravit knihu', 500);
  }

  // Get updated book with full details
  const updatedBook = await bookRepository.findById(id);

  res.json({
    success: true,
    message: 'Kniha byla úspěšně upravena',
    data: updatedBook
  });
});

/**
 * Delete book (admin, teachers only)
 * DELETE /api/books/:id
 */
const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if book exists
  const book = await bookRepository.findById(id);
  if (!book) {
    throw new AppError('Kniha nebyla nalezena', 404);
  }

  // Check if book is used in any reading lists
  const isUsed = await bookRepository.isUsedInReadingLists(id);
  if (isUsed) {
    throw new AppError('Nemohu vymazat knihu, která se již nachází u někoho v četbě', 400);
  }

  // Delete book
  const deleted = await bookRepository.delete(id);

  if (!deleted) {
    throw new AppError('Nepodařilo se vymazat knihu', 500);
  }

  res.json({
    success: true,
    message: 'Kniha byla vymazána'
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
