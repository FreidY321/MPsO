const StudentBookRepository = require('../repositories/StudentBookRepository');
const BookRepository = require('../repositories/BookRepository');
const AppError = require('../utils/AppError');

/**
 * ReadingListService handles business logic for reading lists
 * Validates rules for maturitní zkouška requirements
 */
class ReadingListService {
  constructor() {
    this.studentBookRepository = new StudentBookRepository();
    this.bookRepository = new BookRepository();
  }

  /**
   * Validate if a book can be added to student's reading list
   * Checks the max 2 books per author rule
   * @param {number} studentId - Student user ID
   * @param {number} bookId - Book ID to add
   * @returns {Promise<Object>} { canAdd: boolean, reason: string }
   */
  async validateBookAddition(studentId, bookId) {
    // Get book details to find author
    const book = await this.bookRepository.findById(bookId);
    
    if (!book) {
      return {
        canAdd: false,
        reason: 'Book not found'
      };
    }

    // Check if student already has this book
    const hasBook = await this.studentBookRepository.hasBook(studentId, bookId);
    if (hasBook) {
      return {
        canAdd: false,
        reason: 'Book is already in your reading list'
      };
    }

    // Check author limit (max 2 books per author)
    const authorBookCount = await this.studentBookRepository.getAuthorBookCount(studentId, book.author_id);
    
    if (authorBookCount >= 2) {
      return {
        canAdd: false,
        reason: `You already have ${authorBookCount} books by this author. Maximum is 2 books per author.`
      };
    }

    return {
      canAdd: true,
      reason: 'Book can be added'
    };
  }

  /**
   * Calculate reading list status with all validation information
   * @param {number} studentId - Student user ID
   * @returns {Promise<Object>} ReadingListStatus object
   */
  async calculateReadingListStatus(studentId) {
    // Get category counts
    const categoryCounts = await this.studentBookRepository.getCategoryCounts(studentId);
    
    // Get author counts
    const authorCounts = await this.studentBookRepository.getAuthorCounts(studentId);
    
    // Get total book count
    const totalBooks = await this.studentBookRepository.getBookCount(studentId);

    // Process literary class progress
    const literaryClassProgress = categoryCounts.literaryClasses.map(lc => {
      const currentCount = parseInt(lc.current_count) || 0;
      const minRequired = parseInt(lc.min_request) || 0;
      const maxAllowed = parseInt(lc.max_request) || 0;
      
      return {
        id: lc.id,
        name: lc.name,
        currentCount,
        minRequired,
        maxAllowed,
        isSatisfied: currentCount >= minRequired,
        isOverLimit: currentCount > maxAllowed
      };
    });

    // Process period progress
    const periodProgress = categoryCounts.periods.map(p => {
      const currentCount = parseInt(p.current_count) || 0;
      const minRequired = parseInt(p.min_request) || 0;
      const maxAllowed = parseInt(p.max_request) || 0;
      
      return {
        id: p.id,
        name: p.name,
        currentCount,
        minRequired,
        maxAllowed,
        isSatisfied: currentCount >= minRequired,
        isOverLimit: currentCount > maxAllowed
      };
    });

    // Process author counts
    const authorCountsMap = {};
    authorCounts.forEach(ac => {
      const fullName = [
        ac.author_name,
        ac.author_second_name,
        ac.author_surname,
        ac.author_second_surname
      ].filter(Boolean).join(' ');
      
      authorCountsMap[ac.author_id] = {
        fullName,
        count: parseInt(ac.count) || 0,
        canAddMore: (parseInt(ac.count) || 0) < 2
      };
    });

    // Check if all requirements are satisfied
    const allLiteraryClassesSatisfied = literaryClassProgress.every(lc => lc.isSatisfied && !lc.isOverLimit);
    const allPeriodsSatisfied = periodProgress.every(p => p.isSatisfied && !p.isOverLimit);
    const isComplete = allLiteraryClassesSatisfied && allPeriodsSatisfied;

    // Collect violations
    const violations = [];
    
    literaryClassProgress.forEach(lc => {
      if (!lc.isSatisfied) {
        violations.push(`${lc.name}: needs ${lc.minRequired - lc.currentCount} more book(s) (minimum ${lc.minRequired})`);
      }
      if (lc.isOverLimit) {
        violations.push(`${lc.name}: exceeds maximum by ${lc.currentCount - lc.maxAllowed} book(s) (maximum ${lc.maxAllowed})`);
      }
    });
    
    periodProgress.forEach(p => {
      if (!p.isSatisfied) {
        violations.push(`${p.name}: needs ${p.minRequired - p.currentCount} more book(s) (minimum ${p.minRequired})`);
      }
      if (p.isOverLimit) {
        violations.push(`${p.name}: exceeds maximum by ${p.currentCount - p.maxAllowed} book(s) (maximum ${p.maxAllowed})`);
      }
    });

    return {
      studentId,
      totalBooks,
      literaryClassProgress,
      periodProgress,
      authorCounts: authorCountsMap,
      isComplete,
      violations
    };
  }

  /**
   * Validate if reading list can be finalized
   * @param {number} studentId - Student user ID
   * @returns {Promise<Object>} { canFinalize: boolean, reason: string, status: Object }
   */
  async validateFinalization(studentId) {
    const status = await this.calculateReadingListStatus(studentId);

    if (status.isComplete) {
      return {
        canFinalize: true,
        reason: 'Reading list meets all requirements',
        status
      };
    }

    return {
      canFinalize: false,
      reason: 'Reading list does not meet all requirements',
      status
    };
  }
}

module.exports = ReadingListService;
