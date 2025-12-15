const BaseRepository = require('./BaseRepository');

/**
 * LiteraryClassRepository handles all database operations for Literary_classes table
 */
class LiteraryClassRepository extends BaseRepository {
  constructor() {
    super('Literary_classes');
  }

  /**
   * Find all literary classes ordered by name
   * @returns {Promise<Array>} All literary classes
   */
  async findAll() {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY name`;
    return await this.query(sql);
  }

  /**
   * Find a literary class by ID
   * @param {number} id - Literary class ID
   * @returns {Promise<Object|null>} Literary class or null if not found
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new literary class
   * @param {Object} literaryClassData - Literary class data (name, min_request, max_request)
   * @returns {Promise<Object>} Created literary class with ID
   */
  async create(literaryClassData) {
    const fields = Object.keys(literaryClassData);
    const values = Object.values(literaryClassData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...literaryClassData
    };
  }

  /**
   * Update literary class data
   * @param {number} id - Literary class ID
   * @param {Object} literaryClassData - Updated literary class data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, literaryClassData) {
    const fields = Object.keys(literaryClassData);
    const values = Object.values(literaryClassData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a literary class
   * @param {number} id - Literary class ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Check if literary class has any books
   * @param {number} literaryClassId - Literary class ID
   * @returns {Promise<boolean>} True if literary class has books
   */
  async hasBooks(literaryClassId) {
    const sql = `SELECT 1 FROM Books WHERE literary_class = ? LIMIT 1`;
    const results = await this.query(sql, [literaryClassId]);
    return results.length > 0;
  }

  /**
   * Find literary class by name
   * @param {string} name - Literary class name
   * @returns {Promise<Object|null>} Literary class or null if not found
   */
  async findByName(name) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
    const results = await this.query(sql, [name]);
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = LiteraryClassRepository;
