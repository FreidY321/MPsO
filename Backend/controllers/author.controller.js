const { body, param, validationResult } = require('express-validator');
const AuthorRepository = require('../repositories/AuthorRepository');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authorRepository = new AuthorRepository();

/**
 * Get all authors
 * GET /api/authors
 */
const getAllAuthors = asyncHandler(async (req, res) => {
  const authors = await authorRepository.findAll();

  res.json({
    success: true,
    count: authors.length,
    data: authors
  });
});

/**
 * Get author by ID
 * GET /api/authors/:id
 */
const getAuthorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const author = await authorRepository.findById(id);

  if (!author) {
    throw new AppError('Autor nebyl nalezen', 404);
  }

  res.json({
    success: true,
    data: author
  });
});

/**
 * Create author validation rules
 */
const createAuthorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Autorovo jméno je povinné'),
  body('second_name')
    .optional()
    .trim(),
  body('surname')
    .trim()
    .notEmpty()
    .withMessage('Autorovo přijmení je povinné'),
  body('second_surname')
    .optional()
    .trim()
];

/**
 * Create a new author (admin only)
 * POST /api/authors
 */
const createAuthor = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { name, second_name, surname, second_surname } = req.body;

  // Create author data object
  const authorData = {
    name,
    surname
  };

  // Add optional fields
  if (second_name) authorData.second_name = second_name;
  if (second_surname) authorData.second_surname = second_surname;

  // Create author
  const newAuthor = await authorRepository.create(authorData);

  res.status(201).json({
    success: true,
    message: 'Autor byl úspěšně vytvořen',
    data: newAuthor
  });
});

/**
 * Update author validation rules
 */
const updateAuthorValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Autorovo ID musí být přirozené číslo.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Autorovo jméno je povinné.'),
  body('second_name')
    .optional()
    .trim(),
  body('surname')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Autorovo přijmení je povinné.'),
  body('second_surname')
    .optional()
    .trim()
];

/**
 * Update author (admin only)
 * PUT /api/authors/:id
 */
const updateAuthor = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if author exists
  const existingAuthor = await authorRepository.findById(id);
  if (!existingAuthor) {
    throw new AppError('Autor nebyl nalezen', 404);
  }

  // Update author
  const updated = await authorRepository.update(id, updateData);

  if (!updated) {
    throw new AppError('Nepodařilo se upravit autora', 500);
  }

  // Get updated author
  const updatedAuthor = await authorRepository.findById(id);

  res.json({
    success: true,
    message: 'Autor byl úspěšně upraven',
    data: updatedAuthor
  });
});

/**
 * Delete author (admin only)
 * DELETE /api/authors/:id
 */
const deleteAuthor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if author exists
  const author = await authorRepository.findById(id);
  if (!author) {
    throw new AppError('Autor nebyl nalezen', 404);
  }

  // Check if author has books
  const hasBooks = await authorRepository.hasBooks(id);
  if (hasBooks) {
    throw new AppError('Nelze vymazat autora, protože jsou v databázi jeho knihy', 400);
  }

  // Delete author
  const deleted = await authorRepository.delete(id);

  if (!deleted) {
    throw new AppError('Nepodařilo se vymazat autora', 500);
  }

  res.json({
    success: true,
    message: 'Autor byl vymazán'
  });
});

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  createAuthorValidation,
  updateAuthor,
  updateAuthorValidation,
  deleteAuthor
};
