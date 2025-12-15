const express = require('express');
const router = express.Router();
const {
  getMyReadingList,
  getStudentReadingList,
  addBook,
  addBookValidation,
  removeBook,
  getMyReadingListStatus,
  finalizeReadingList,
  getMyReadingListPdf,
  getStudentReadingListPdf
} = require('../controllers/readingList.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Student routes - get own reading list
router.get('/my', authorizeRole(['student']), getMyReadingList);
router.get('/my/status', authorizeRole(['student']), getMyReadingListStatus);
router.get('/my/pdf', authorizeRole(['student']), getMyReadingListPdf);
router.post('/books', authorizeRole(['student']), addBookValidation, addBook);
router.delete('/books/:bookId', authorizeRole(['student']), removeBook);
router.post('/finalize', authorizeRole(['student']), finalizeReadingList);

// Admin/Teacher routes - get any student's reading list
router.get('/:studentId', authorizeRole(['admin', 'teacher']), getStudentReadingList);
router.get('/:studentId/pdf', authorizeRole(['admin', 'teacher']), getStudentReadingListPdf);

module.exports = router;
