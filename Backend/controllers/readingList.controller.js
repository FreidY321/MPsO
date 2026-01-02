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
    .withMessage('ID knihy musí být přirozené číslo.')
];

/**
 * Add book to reading list
 * POST /api/reading-lists/books
 */
const addBook = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
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
    message: 'Kniha byla přidána do seznamu četby',
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
    throw new AppError('Kniha nebyla nalezena ve tvé maturitní četbě', 404);
  }

  // Remove book from reading list
  const removed = await studentBookRepository.removeBook(studentId, bookId);

  if (!removed) {
    throw new AppError('Knihu se nepodařilo odstranit', 500);
  }

  // Get updated reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.json({
    success: true,
    message: 'Kniha byla odstraněna z tvého seznamu četby',
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
  getMyReadingListPdf,
  getStudentReadingListPdf
};
