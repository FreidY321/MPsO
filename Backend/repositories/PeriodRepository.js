const BaseRepository = require('./BaseRepository');

/**
 * PeriodRepository handles all database operations for Periods table
 */
class PeriodRepository extends BaseRepository {
  constructor() {
    super('Periods');
  }

  /**
   * Find all periods ordered by name
   * @returns {Promise<Array>} All periods
   */
  async findAll() {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY name`;
    return await this.query(sql);
  }

  /**
   * Find a period by ID
   * @param {number} id - Period ID
   * @returns {Promise<Object|null>} Period or null if not found
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new period
   * @param {Object} periodData - Period data (name, min_request, max_request)
   * @returns {Promise<Object>} Created period with ID
   */
  async create(periodData) {
    const fields = Object.keys(periodData);
    const values = Object.values(periodData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...periodData
    };
  }

  /**
   * Update period data
   * @param {number} id - Period ID
   * @param {Object} periodData - Updated period data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, periodData) {
    const fields = Object.keys(periodData);
    const values = Object.values(periodData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a period
   * @param {number} id - Period ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Check if period has any books
   * @param {number} periodId - Period ID
   * @returns {Promise<boolean>} True if period has books
   */
  async hasBooks(periodId) {
    const sql = `SELECT 1 FROM Books WHERE period = ? LIMIT 1`;
    const results = await this.query(sql, [periodId]);
    return results.length > 0;
  }

  /**
   * Find period by name
   * @param {string} name - Period name
   * @returns {Promise<Object|null>} Period or null if not found
   */
  async findByName(name) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
    const results = await this.query(sql, [name]);
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = PeriodRepository;
