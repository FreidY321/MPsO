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
   * Checks the max books per author rule
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
        reason: 'Kniha nebyla nalezena'
      };
    }

    // Check if student already has this book
    const hasBook = await this.studentBookRepository.hasBook(studentId, bookId);
    if (hasBook) {
      return {
        canAdd: false,
        reason: 'Tato kniha je už ve tvém seznamu četby'
      };
    }

    // Check author limit (max books per author)
    const authorBookCount = await this.studentBookRepository.getAuthorBookCount(studentId, book.author_id);
    
    if (authorBookCount >= (process.env.MAX_BOOKS_PER_AUTHOR || 2)) {
      return {
        canAdd: false,
        reason: `Už máš ${authorBookCount} knihy od tohoto autora. Maximum jsou ${process.env.MAX_BOOKS_PER_AUTHOR} knihy od stejného autora. Nelze tudíž přidat další.`
      };
    }

    // Check count of the books
    const books = await this.studentBookRepository.findByStudentId(studentId);
    if(books.length >= (process.env.TOTAL_BOOKS_REQUIRED || 20)){
      return {
        canAdd: false,
        reason: `Už máš ${process.env.TOTAL_BOOKS_REQUIRED || 20} knih v seznamu četby`
      };
    }

    return {
      canAdd: true,
      reason: 'Kniha může být přidána'
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
      const maxAllowed = parseInt(lc.max_request);
      
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
      const maxAllowed = parseInt(p.max_request);
      
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
        canAddMore: (parseInt(ac.count) || 0) < (process.env.MAX_BOOKS_PER_AUTHOR || 2)
      };
    });

    // Check if all requirements are satisfied
    const allLiteraryClassesSatisfied = literaryClassProgress.every(lc => lc.isSatisfied && !lc.isOverLimit);
    const allPeriodsSatisfied = periodProgress.every(p => p.isSatisfied && !p.isOverLimit);
    const isComplete = allLiteraryClassesSatisfied && allPeriodsSatisfied && totalBooks == (process.env.TOTAL_BOOKS_REQUIRED || 20);
    // Collect violations
    const violations = [];

    if(totalBooks != (process.env.TOTAL_BOOKS_REQUIRED || 20)){
      violations.push(`V povinné četbě je potřeba mít přesně ${process.env.TOTAL_BOOKS_REQUIRED || 20} knih`);
    }
    
    literaryClassProgress.forEach(lc => {
      if (!lc.isSatisfied) {
        if((lc.minRequired - lc.currentCount) === 1){
          violations.push(`${lc.name}: musí mít o ${lc.minRequired - lc.currentCount} knihu více (minimum je ${lc.minRequired})`);
        }else if((lc.minRequired - lc.currentCount) < 5){
          violations.push(`${lc.name}: musí mít o ${lc.minRequired - lc.currentCount} knihy více (minimum je ${lc.minRequired})`);
        }else{
          violations.push(`${lc.name}: musí mít o ${lc.minRequired - lc.currentCount} knih více (minimum je ${lc.minRequired})`);
        }
      }
      if (lc.isOverLimit) {
        if((lc.maxAllowed - lc.currentCount) === 1){
          violations.push(`${lc.name}: přesahuje maximum o ${lc.currentCount - lc.maxAllowed} knihu (maximum je ${lc.maxAllowed})`);
        }else if((lc.maxAllowed - lc.currentCount) < 5){
          violations.push(`${lc.name}: přesahuje maximum o ${lc.currentCount - lc.maxAllowed} knihy (maximum je ${lc.maxAllowed})`);
        }else{
          violations.push(`${lc.name}: přesahuje maximum o ${lc.currentCount - lc.maxAllowed} knih (maximum je ${lc.maxAllowed})`);
        }
      }
    });
    
    periodProgress.forEach(p => {
      if (!p.isSatisfied) {
        if((p.minRequired - p.currentCount) === 1){
          violations.push(`${p.name}: musí mít o ${p.minRequired - p.currentCount} knihu více (minimum je ${p.minRequired})`);
        }else if((p.minRequired - p.currentCount) < 5){
          violations.push(`${p.name}: musí mít o ${p.minRequired - p.currentCount} knihy více (minimum je ${p.minRequired})`);
        }else{
          violations.push(`${p.name}: musí mít o ${p.minRequired - p.currentCount} knih více (minimum je ${p.minRequired})`);
        }
      }
      if (p.isOverLimit) {
        if((p.maxAllowed - p.currentCount) === 1){
          violations.push(`${p.name}: přesahuje maximum o ${p.currentCount - p.maxAllowed} knihu (maximum je ${p.maxAllowed})`);
        }else if((p.maxAllowed - p.currentCount) < 5){
          violations.push(`${p.name}: přesahuje maximum o ${p.currentCount - p.maxAllowed} knihy (maximum je ${p.maxAllowed})`);
        }else{
          violations.push(`${p.name}: přesahuje maximum o ${p.currentCount - p.maxAllowed} knih (maximum je ${p.maxAllowed})`);
        }
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
        reason: 'Maturitní četba splňuje všechny požadavky',
        status
      };
    }

    return {
      canFinalize: false,
      reason: 'Maturitní četba nesplňuje všechny požadavky',
      status
    };
  }
}

module.exports = ReadingListService;
