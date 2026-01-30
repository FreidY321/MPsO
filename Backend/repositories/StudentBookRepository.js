const { pool } = require('../config/database');

/**
 * StudentBookRepository handles all database operations for student_book table
 * This table has a composite primary key (id_student, id_book)
 */
class StudentBookRepository {
  constructor() {
    this.tableName = 'student_book';
    this.pool = pool;
  }

  /**
   * Execute a SQL query with parameters
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  /**
   * Find all books for a student with full book details
   * @param {number} studentId - Student user ID
   * @returns {Promise<Array>} Array of books in student's reading list
   */
  async findByStudentId(studentId) {
    const sql = `
      SELECT 
        sb.id_student,
        sb.id_book,
        sb.when_added,
        b.name as book_name,
        b.url_book,
        b.translator_name,
        a.id as author_id,
        a.name as author_name,
        a.second_name as author_second_name,
        a.surname as author_surname,
        a.second_surname as author_second_surname,
        p.id as period_id,
        p.name as period_name,
        p.min_request as period_min,
        p.max_request as period_max,
        lc.id as literary_class_id,
        lc.name as literary_class_name,
        lc.min_request as literary_class_min,
        lc.max_request as literary_class_max
      FROM ${this.tableName} sb
      INNER JOIN Books b ON sb.id_book = b.id
      INNER JOIN Authors a ON b.author_id = a.id
      INNER JOIN Periods p ON b.period = p.id
      INNER JOIN Literary_classes lc ON b.literary_class = lc.id
      WHERE sb.id_student = ?
      ORDER BY lc.name, p.name, b.name
    `;
    return await this.query(sql, [studentId]);
  }

  /**
   * Add a book to student's reading list
   * @param {number} studentId - Student user ID
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Created record
   * @throws {Error} If book is already in student's reading list
   */
  async addBook(studentId, bookId) {
    
    // Check if book already exists in student's reading list
    const exists = await this.hasBook(studentId, bookId);
    if (exists) {
      throw new Error('Kniha už je v tvém seznamu četby');
    }

    const authorBookCount = await this.getAuthorBookCount(studentId, book.author_id);
    if (authorBookCount >= 2) {
      throw new Error('Už máš 2 knihy od tohoto autora');
    }

    const booksCount = await this.getBookCount(studentId);
    if (booksCount >= 20) {
      throw new Error('Už máš 20 knih v seznamu četby, nemůžeš přidat další knihu');
    }
    
    const whenAdded = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO ${this.tableName} (id_student, id_book, when_added)
      VALUES (?, ?, ?)
    `;
    await this.query(sql, [studentId, bookId, whenAdded]);
    
    return {
      id_student: studentId,
      id_book: bookId,
      when_added: whenAdded
    };
  }

  /**
   * Remove a book from student's reading list
   * @param {number} studentId - Student user ID
   * @param {number} bookId - Book ID
   * @returns {Promise<boolean>} True if removed, false if not found
   */
  async removeBook(studentId, bookId) {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id_student = ? AND id_book = ?
    `;
    const result = await this.query(sql, [studentId, bookId]);
    return result.affectedRows > 0;
  }

  /**
   * Get count of books by each author for a student
   * @param {number} studentId - Student user ID
   * @returns {Promise<Array>} Array of { author_id, author_name, count }
   */
  async getAuthorCounts(studentId) {
    const sql = `
      SELECT 
        a.id as author_id,
        a.name as author_name,
        a.second_name as author_second_name,
        a.surname as author_surname,
        a.second_surname as author_second_surname,
        COUNT(*) as count
      FROM ${this.tableName} sb
      INNER JOIN Books b ON sb.id_book = b.id
      INNER JOIN Authors a ON b.author_id = a.id
      WHERE sb.id_student = ?
      GROUP BY a.id, a.name, a.second_name, a.surname, a.second_surname
      ORDER BY count DESC, a.surname, a.name
    `;
    return await this.query(sql, [studentId]);
  }

  /**
   * Get count of books by literary class and period for a student
   * @param {number} studentId - Student user ID
   * @returns {Promise<Object>} Object with literaryClasses and periods arrays
   */
  async getCategoryCounts(studentId) {
    // Get literary class counts
    const literaryClassSql = `
      SELECT 
        lc.id,
        lc.name,
        lc.min_request,
        lc.max_request,
        COUNT(sb.id_book) as current_count
      FROM Literary_classes lc
      LEFT JOIN Books b ON lc.id = b.literary_class
      LEFT JOIN ${this.tableName} sb ON b.id = sb.id_book AND sb.id_student = ?
      GROUP BY lc.id, lc.name, lc.min_request, lc.max_request
      ORDER BY lc.name
    `;
    
    // Get period counts
    const periodSql = `
      SELECT 
        p.id,
        p.name,
        p.min_request,
        p.max_request,
        COUNT(sb.id_book) as current_count
      FROM Periods p
      LEFT JOIN Books b ON p.id = b.period
      LEFT JOIN ${this.tableName} sb ON b.id = sb.id_book AND sb.id_student = ?
      GROUP BY p.id, p.name, p.min_request, p.max_request
      ORDER BY p.name
    `;
    
    const literaryClasses = await this.query(literaryClassSql, [studentId]);
    const periods = await this.query(periodSql, [studentId]);
    
    return {
      literaryClasses,
      periods
    };
  }

  /**
   * Check if a student has a specific book in their reading list
   * @param {number} studentId - Student user ID
   * @param {number} bookId - Book ID
   * @returns {Promise<boolean>} True if student has the book
   */
  async hasBook(studentId, bookId) {
    const sql = `
      SELECT 1 FROM ${this.tableName}
      WHERE id_student = ? AND id_book = ?
      LIMIT 1
    `;
    const results = await this.query(sql, [studentId, bookId]);
    return results.length > 0;
  }

  /**
   * Get total count of books for a student
   * @param {number} studentId - Student user ID
   * @returns {Promise<number>} Total book count
   */
  async getBookCount(studentId) {
    const sql = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE id_student = ?
    `;
    const results = await this.query(sql, [studentId]);
    return results[0].count;
  }

  /**
   * Remove all books from a student's reading list
   * @param {number} studentId - Student user ID
   * @returns {Promise<number>} Number of books removed
   */
  async removeAllBooks(studentId) {
    const sql = `DELETE FROM ${this.tableName} WHERE id_student = ?`;
    const result = await this.query(sql, [studentId]);
    return result.affectedRows;
  }

  /**
   * Get count of books by a specific author for a student
   * @param {number} studentId - Student user ID
   * @param {number} authorId - Author ID
   * @returns {Promise<number>} Count of books by the author
   */
  async getAuthorBookCount(studentId, authorId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM ${this.tableName} sb
      INNER JOIN Books b ON sb.id_book = b.id
      WHERE sb.id_student = ? AND b.author_id = ?
    `;
    const results = await this.query(sql, [studentId, authorId]);
    return results[0].count;
  }
}

module.exports = StudentBookRepository;
