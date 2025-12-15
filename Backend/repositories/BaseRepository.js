const { pool } = require('../config/database');

/**
 * Base Repository class providing common CRUD operations
 * All specific repositories should extend this class
 */
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
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
   * Find all records in the table
   * @returns {Promise<Array>} All records
   */
  async findAll() {
    const sql = `SELECT * FROM ${this.tableName}`;
    return await this.query(sql);
  }

  /**
   * Find a record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record with ID
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a record by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Find records by a specific field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {Promise<Array>} Matching records
   */
  async findBy(field, value) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${field} = ?`;
    return await this.query(sql, [value]);
  }

  /**
   * Count total records in the table
   * @returns {Promise<number>} Total count
   */
  async count() {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const results = await this.query(sql);
    return results[0].count;
  }

  /**
   * Check if a record exists by ID
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const results = await this.query(sql, [id]);
    return results.length > 0;
  }
}

module.exports = BaseRepository;
