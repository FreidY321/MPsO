const express = require('express');
const router = express.Router();

// Import route modules here as they are created
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const classRoutes = require('./class.routes');
const authorRoutes = require('./author.routes');
const literaryClassRoutes = require('./literaryClass.routes');
const periodRoutes = require('./period.routes');
const bookRoutes = require('./book.routes');
const readingListRoutes = require('./readingList.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/authors', authorRoutes);
router.use('/literary-classes', literaryClassRoutes);
router.use('/periods', periodRoutes);
router.use('/books', bookRoutes);
router.use('/reading-lists', readingListRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

module.exports = router;
