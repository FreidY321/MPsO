const { body, param, validationResult } = require('express-validator');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const UserRepository = require('../repositories/UserRepository');
const ClassRepository = require('../repositories/ClassRepository');
const ReadingListService = require('../services/ReadingListService');
const PdfService = require('../services/PdfService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const studentBookRepository = new StudentBookRepository();
const userRepository = new UserRepository();
const classRepository = new ClassRepository();
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
 * Get reading list for a specific student (admin, teachers only)
 * GET /api/reading-lists/:studentId
 */
const getStudentReadingList = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await userRepository.findById(studentId);

  if(student.role  !== 'student') {
    throw new AppError('Zadané ID není žák', 400);
  }

  if (req.user.role === 'teacher') {

    const student = await userRepository.findById(studentId);
    
    if (!student) {
      throw new AppError('Žák nebyl nalezen', 404);
    }
    
    if (!student.class_id) {
      throw new AppError('Nemáte přístup k maturitnímu listu tohoto žáka', 403);
    }
    
    const studentsClass = await classRepository.findById(student.class_id);
    
    if (!studentsClass || studentsClass.cj_teacher !== req.user.id) {
      throw new AppError('Nemáte přístup k maturitnímu listu tohoto žáka', 403);
    }
  }

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
 * Add books validation rules
 */
const addBooksValidation = [
  body('bookIds')
    .isArray({ min: 1 })
    .withMessage('Musíš zadat alespoň jedno ID knihy.'),
  body('bookIds.*')
    .isInt({ min: 1 })
    .withMessage('Všechna ID knih musí být přirozená čísla.')
];

/**
 * Add multiple books to reading list
 * POST /api/reading-lists/books/batch
 */
const addBooks = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const studentId = req.user.id;
  const { bookIds } = req.body;

  const result = {
    added: [],
    errors: []
  };

  for (const bookId of bookIds) {
    try {
      // Validate if book can be added (author limit check)
      const validation = await readingListService.validateBookAddition(studentId, bookId);
      
      if (!validation.canAdd) {
        result.errors.push({
          bookId,
          reason: validation.reason
        });
        continue;
      }

      // Add book to reading list
      const added = await studentBookRepository.addBook(studentId, bookId);
      result.added.push(added);
    } catch (error) {
      result.errors.push({
        bookId,
        reason: error.message
      });
    }
  }

  // Get updated reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.status(201).json({
    success: true,
    message: result.errors.length === 0 
      ? 'Knihy byly přidány do seznamu četby' 
      : 'Některé knihy nebylo možné přidat',
    data: result,
    status
  });
});

/**
 * Remove multiple books from reading list
 * DELETE /api/reading-lists/books
 */
const removeBooks = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => error.msg).join('<br> ');
    throw new AppError(errorMessage, 400, errors.array());
  }

  const studentId = req.user.id;
  const { bookIds } = req.body;

  const result = {
    removed: [],
    notFound: []
  };

  for (const bookId of bookIds) {
    try {
      // Check if book exists in reading list
      const hasBook = await studentBookRepository.hasBook(studentId, bookId);
      
      if (!hasBook) {
        result.notFound.push({ bookId });
        continue;
      }

      // Remove book from reading list
      const removed = await studentBookRepository.removeBook(studentId, bookId);
      
      if (removed) {
        result.removed.push({ bookId });
      } else {
        result.notFound.push({ bookId });
      }
    } catch (error) {
      result.notFound.push({ bookId });
    }
  }

  // Get updated reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.json({
    success: true,
    message: result.notFound.length === 0
      ? 'Knihy byly odstraněny z tvého seznamu četby'
      : 'Některé knihy nebyly nalezeny ve tvém seznamu četby',
    data: result,
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
 * Get reading list status (validation against requirements)
 * GET /api/reading-lists/:studentId/status
 */
const getStudentReadingListStatus = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await userRepository.findById(studentId);

  if(student.role  !== 'student')
    throw new AppError('Zadané ID není žák', 400);

  // Calculate reading list status
  const status = await readingListService.calculateReadingListStatus(studentId);

  res.json({
    success: true,
    data: status
  });
});

/**
 * Get reading list status for all students in a class
 * GET /api/reading-lists/class/:classId/status
 */
const getClassReadingListStatus = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  // Check if class exists
  const classData = await classRepository.findById(classId);
  if (!classData) {
    throw new AppError('Třída nebyla nalezena', 404);
  }

  // Check teacher access
  if (req.user.role === 'teacher') {
    if (classData.cj_teacher !== req.user.id) {
      throw new AppError('Nemáte přístup k maturitním listům této třídy', 403);
    }
  }

  // Get all students in the class
  const students = await classRepository.getStudentsByClassId(classId);

  // Get reading list status for each student
  const studentStatuses = [];
  for (const student of students) {
    const status = await readingListService.calculateReadingListStatus(student.id);
    studentStatuses.push({
      studentId: student.id,
      ...status
    });
  }

  // Calculate summary
  const completedCount = studentStatuses.filter(s => s.isComplete).length;

  res.json({
    success: true,
    data: {
      classId,
      totalStudents: students.length,
      completedStudents: completedCount,
      pendingStudents: students.length - completedCount,
      completionPercentage: students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0,
      studentStatuses
    }
  });
});

/**
 * Generate PDF for current student's reading list
 * GET /api/reading-lists/my/pdf
 */
const getMyReadingListPdf = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const status = await readingListService.calculateReadingListStatus(student.id);
  
  if(status.isComplete != true)
    throw new AppError('Nelze vygenerovat PDF, protože maturitní seznam není hotový.', 400);

  // Generate PDF
  const pdfDoc = await pdfService.generateReadingListPdf(studentId);

  // Set response headers for PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reading-list.pdf');

  // Pipe PDF to response
  pdfDoc.pipe(res);
});

/**
 * Generate PDF for a specific student's reading list (admin, teachers only)
 * GET /api/reading-lists/:studentId/pdf
 */
const getStudentReadingListPdf = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  const status = await readingListService.calculateReadingListStatus(parseInt(studentId));
  const student = await userRepository.findById(studentId);
  
  if(student.role  !== 'student')
    throw new AppError('Zadané ID není žák', 400);

  if (req.user.role === 'teacher') {

    const student = await userRepository.findById(studentId);
    
    if (!student) {
      throw new AppError('Žák nebyl nalezen', 404);
    }
    
    if (!student.class_id) {
      throw new AppError('Nemáte přístup k maturitnímu listu tohoto žáka', 403);
    }
    
    const studentsClass = await classRepository.findById(student.class_id);
    
    if (!studentsClass || studentsClass.cj_teacher !== req.user.id) {
      throw new AppError('Nemáte přístup k maturitnímu listu tohoto žáka', 403);
    }
  }

  if(status.isComplete != true)
    throw new AppError('Nelze vygenerovat PDF, protože maturitní seznam není hotový.', 400);

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
  addBooks,
  addBooksValidation,
  removeBooks,
  getMyReadingListStatus,
  getStudentReadingListStatus,
  getClassReadingListStatus,
  getMyReadingListPdf,
  getStudentReadingListPdf
};
