const { body, param, validationResult } = require('express-validator');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const ReadingListService = require('../services/ReadingListService');
const PdfService = require('../services/PdfService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const studentBookRepository = new StudentBookRepository();
const readingListService = new ReadingListService();
const pdfService = new PdfService();

/**
 * Get reading list for current student
 * GET /api/reading-lists/my
 */
const getMyReadingList = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Get student's reading list with full book details
  const books = await studentBookRepository.findByStudentId(studentId);

  res.json({
    success: true,
    count: books.length,
    data: books
  });
});

/**
 * Get reading list for a specific student (admin/teacher only)
 * GET /api/reading-lists/:studentId
 */
const getStudentReadingList = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Get student's reading list with full book details
  const books = await studentBookRepository.findByStudentId(studentId);

  res.json({
    success: true,
    studentId: parseInt(studentId),
    count: books.length,
    data: books
  });
});

/**
 * Add book validation rules
 */
const addBookValidation = [
  body('bookId')
    .isInt({ min: 1 })
    .withMessage('Book ID must be a positive integer')
];

/**
 * Add book to reading list
 * POST /api/reading-lists/books
 */
const addBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = (req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const studentId = req.user.id;
  const { bookId } = req.body;

  // Validate if book can be added (author limit check)
  const validation = await readingListService.validateBookAddition(studentId, bookId);
  
  if (!validation.canAdd) {
    throw new AppError(validation.reason, 400);
  }

  // Add book to reading list
  const result = await studentBookRepository.addBook(studentId, bookId);

  // Get updated reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.status(201).json({
    success: true,
    message: 'Book added to reading list',
    data: result,
    status
  });
});

/**
 * Remove book from reading list
 * DELETE /api/reading-lists/books/:bookId
 */
const removeBook = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { bookId } = req.params;

  // Check if book exists in reading list
  const hasBook = await studentBookRepository.hasBook(studentId, bookId);
  
  if (!hasBook) {
    throw new AppError('Book not found in your reading list', 404);
  }

  // Remove book from reading list
  const removed = await studentBookRepository.removeBook(studentId, bookId);

  if (!removed) {
    throw new AppError('Failed to remove book', 500);
  }

  // Get updated reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.json({
    success: true,
    message: 'Book removed from reading list',
    status
  });
});

/**
 * Get reading list status (validation against requirements)
 * GET /api/reading-lists/my/status
 */
const getMyReadingListStatus = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Calculate reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.json({
    success: true,
    data: status
  });
});

/**
 * Finalize reading list (mark as complete)
 * POST /api/reading-lists/finalize
 */
const finalizeReadingList = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Validate if reading list can be finalized
  const validation = await readingListService.validateFinalization(studentId);

  if (!validation.canFinalize) {
    throw new AppError(validation.reason, 400, validation.status.violations);
  }

  // In a real implementation, you might want to add a 'finalized' flag to the database
  // For now, we just return success with the status
  res.json({
    success: true,
    message: 'Reading list meets all requirements and can be finalized',
    data: validation.status
  });
});

/**
 * Generate PDF for current student's reading list
 * GET /api/reading-lists/my/pdf
 */
const getMyReadingListPdf = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Generate PDF
  const pdfDoc = await pdfService.generateReadingListPdf(studentId);

  // Set response headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reading-list.pdf');

  // Pipe PDF to response
  pdfDoc.pipe(res);
});

/**
 * Generate PDF for a specific student's reading list (admin/teacher only)
 * GET /api/reading-lists/:studentId/pdf
 */
const getStudentReadingListPdf = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Generate PDF
  const pdfDoc = await pdfService.generateReadingListPdf(parseInt(studentId));

  // Set response headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=reading-list-student-${studentId}.pdf`);

  // Pipe PDF to response
  pdfDoc.pipe(res);
});

module.exports = {
  getMyReadingList,
  getStudentReadingList,
  addBook,
  addBookValidation,
  removeBook,
  getMyReadingListStatus,
  finalizeReadingList,
  getMyReadingListPdf,
  getStudentReadingListPdf
};
