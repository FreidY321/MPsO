const BaseRepository = require('./BaseRepository');

/**
 * BookRepository handles all database operations for Books table
 */
class BookRepository extends BaseRepository {
  constructor() {
    super('Books');
  }

  /**
   * Find all books with author, period, and literary class information
   * @returns {Promise<Array>} All books with joined data
   */
  async findAll() {
    const sql = `
      SELECT 
        b.*,
        a.name as author_name,
        a.second_name as author_second_name,
        a.surname as author_surname,
        a.second_surname as author_second_surname,
        p.name as period_name,
        lc.name as literary_class_name
      FROM ${this.tableName} b
      INNER JOIN Authors a ON b.author_id = a.id
      INNER JOIN Periods p ON b.period = p.id
      INNER JOIN Literary_classes lc ON b.literary_class = lc.id
      ORDER BY p.name, lc.name, b.name
    `;
    return await this.query(sql);
  }

  /**
   * Find a book by ID with all related information
   * @param {number} id - Book ID
   * @returns {Promise<Object|null>} Book with joined data or null if not found
   */
  async findById(id) {
    const sql = `
      SELECT 
        b.*,
        a.name as author_name,
        a.second_name as author_second_name,
        a.surname as author_surname,
        a.second_surname as author_second_surname,
        p.name as period_name,
        lc.name as literary_class_name
      FROM ${this.tableName} b
      INNER JOIN Authors a ON b.author_id = a.id
      INNER JOIN Periods p ON b.period = p.id
      INNER JOIN Literary_classes lc ON b.literary_class = lc.id
      WHERE b.id = ?
    `;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find books by filters (literary_class, period, author)
   * @param {Object} filters - Filter object { literary_class, period, author_id }
   * @returns {Promise<Array>} Filtered books
   */
  async findByFilters(filters = {}) {
    let sql = `
      SELECT 
        b.*,
        a.name as author_name,
        a.second_name as author_second_name,
        a.surname as author_surname,
        a.second_surname as author_second_surname,
        p.name as period_name,
        lc.name as literary_class_name
      FROM ${this.tableName} b
      INNER JOIN Authors a ON b.author_id = a.id
      INNER JOIN Periods p ON b.period = p.id
      INNER JOIN Literary_classes lc ON b.literary_class = lc.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (filters.literary_class) {
      conditions.push('b.literary_class = ?');
      params.push(filters.literary_class);
    }
    
    if (filters.period) {
      conditions.push('b.period = ?');
      params.push(filters.period);
    }
    
    if (filters.author_id) {
      conditions.push('b.author_id = ?');
      params.push(filters.author_id);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY lc.name, p.name, b.name';
    
    return await this.query(sql, params);
  }

  /**
   * Create a new book
   * @param {Object} bookData - Book data (name, url_book, author_id, translator_name, period, literary_class)
   * @returns {Promise<Object>} Created book with ID
   */
  async create(bookData) {
    const fields = Object.keys(bookData);
    const values = Object.values(bookData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...bookData
    };
  }

  /**
   * Update book data
   * @param {number} id - Book ID
   * @param {Object} bookData - Updated book data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, bookData) {
    const fields = Object.keys(bookData);
    const values = Object.values(bookData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a book
   * @param {number} id - Book ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Check if a book is used in any reading lists
   * @param {number} bookId - Book ID
   * @returns {Promise<boolean>} True if book is in any student's reading list
   */
  async isUsedInReadingLists(bookId) {
    const sql = `SELECT 1 FROM student_book WHERE id_book = ? LIMIT 1`;
    const results = await this.query(sql, [bookId]);
    return results.length > 0;
  }

  /**
   * Get books by author
   * @param {number} authorId - Author ID
   * @returns {Promise<Array>} Books by the author
   */
  async findByAuthor(authorId) {
    return await this.findByFilters({ author_id: authorId });
  }

  /**
   * Get books by literary class
   * @param {number} literaryClassId - Literary class ID
   * @returns {Promise<Array>} Books in the literary class
   */
  async findByLiteraryClass(literaryClassId) {
    return await this.findByFilters({ literary_class: literaryClassId });
  }

  /**
   * Get books by period
   * @param {number} periodId - Period ID
   * @returns {Promise<Array>} Books in the period
   */
  async findByPeriod(periodId) {
    return await this.findByFilters({ period: periodId });
  }
}

module.exports = BookRepository;
