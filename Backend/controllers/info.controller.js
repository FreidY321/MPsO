const asyncHandler = require('../utils/asyncHandler');

/**
 * Get server and school information
 * GET /api/info
 */
const getInfo = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      school: {
        name: process.env.SCHOOL_NAME || 'SPŠEI Ostrava',
        logo: process.env.SCHOOL_LOGO_URL || null,
        bookList: process.env.BOOK_LIST || null
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        apiVersion: '1.0.0'
      },
      readingSettings: {
        totalBooks: parseInt(process.env.TOTAL_BOOKS_REQUIRED) || 20,
        maxPerAutor: process.env.MAX_BOOKS_PER_AUTHOR || 2
      }
    }
  });
});

module.exports = {
  getInfo
};
