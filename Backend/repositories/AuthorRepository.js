const BaseRepository = require('./BaseRepository');

/**
 * AuthorRepository handles all database operations for Authors table
 */
class AuthorRepository extends BaseRepository {
  constructor() {
    super('Authors');
  }

  /**
   * Find all authors ordered by surname
   * @returns {Promise<Array>} All authors
   */
  async findAll() {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY surname, name`;
    return await this.query(sql);
  }

  /**
   * Find an author by ID
   * @param {number} id - Author ID
   * @returns {Promise<Object|null>} Author or null if not found
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new author
   * @param {Object} authorData - Author data (name, second_name, surname, second_surname)
   * @returns {Promise<Object>} Created author with ID
   */
  async create(authorData) {
    const fields = Object.keys(authorData);
    const values = Object.values(authorData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...authorData
    };
  }

  /**
   * Update author data
   * @param {number} id - Author ID
   * @param {Object} authorData - Updated author data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, authorData) {
    const fields = Object.keys(authorData);
    const values = Object.values(authorData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete an author
   * @param {number} id - Author ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Search authors by name (searches in name, second_name, surname, second_surname)
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching authors
   */
  async searchByName(searchTerm) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ? 
         OR second_name LIKE ?
         OR surname LIKE ?
         OR second_surname LIKE ?
      ORDER BY surname, name
    `;
    const searchPattern = `%${searchTerm}%`;
    return await this.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern]);
  }

  /**
   * Get full name of an author
   * @param {Object} author - Author object
   * @returns {string} Full name formatted
   */
  getFullName(author) {
    const parts = [];
    
    if (author.name) parts.push(author.name);
    if (author.second_name) parts.push(author.second_name);
    if (author.surname) parts.push(author.surname);
    if (author.second_surname) parts.push(author.second_surname);
    
    return parts.join(' ');
  }

  /**
   * Check if author has any books
   * @param {number} authorId - Author ID
   * @returns {Promise<boolean>} True if author has books
   */
  async hasBooks(authorId) {
    const sql = `SELECT 1 FROM Books WHERE author_id = ? LIMIT 1`;
    const results = await this.query(sql, [authorId]);
    return results.length > 0;
  }
}

module.exports = AuthorRepository;
