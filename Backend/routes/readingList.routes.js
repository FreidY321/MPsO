const express = require('express');
const router = express.Router();
const {
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
  getStudentReadingListPdf,
  getMyClassesStatus,
  getClassReadingListXlsx
} = require('../controllers/readingList.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Student routes - get own reading list
router.get('/my', authorizeRole(['student']), getMyReadingList);
router.get('/my/status', authorizeRole(['student']), getMyReadingListStatus);
router.get('/my/pdf', authorizeRole(['student']), getMyReadingListPdf);
router.post('/books', authorizeRole(['student']), addBookValidation, addBook);
router.post('/books/batch', authorizeRole(['student']), addBooksValidation, addBooks);
router.delete('/books', authorizeRole(['student']), removeBooks);
router.delete('/books/:bookId', authorizeRole(['student']), removeBook);

// Admin/Teacher routes (admin get any student's reading list, teacher access only the lists of the students that they teach)
router.get('/:studentId', authorizeRole(['admin', 'teacher']), getStudentReadingList);
router.get('/:studentId/pdf', authorizeRole(['admin', 'teacher']), getStudentReadingListPdf);
router.get('/:studentId/status', authorizeRole(['admin', 'teacher']), getStudentReadingListStatus);
router.get('/class/:classId/status', authorizeRole(['admin', 'teacher']), getClassReadingListStatus);
router.get('/classes/my/status', authorizeRole(['admin', 'teacher']), getMyClassesStatus);
router.get('/class/:classId/xlsx', authorizeRole('admin'), getClassReadingListXlsx);

module.exports = router;
