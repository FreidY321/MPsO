const BaseRepository = require('./BaseRepository');

/**
 * UserRepository handles all database operations for Users table
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('Users');
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null if not found
   */
  async findByEmail(email) {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
    const results = await this.query(sql, [email]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find a user by Google ID
   * @param {string} googleId - Google OAuth ID
   * @returns {Promise<Object|null>} User or null if not found
   */
  async findByGoogleId(googleId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE google_id = ?`;
    const results = await this.query(sql, [googleId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all users by class ID
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Array of users in the class
   */
  async findByClassId(classId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE class_id = ?`;
    return await this.query(sql, [classId]);
  }

  /**
   * Find users by role
   * @param {string} role - User role (student, teacher, admin)
   * @returns {Promise<Array>} Array of users with the specified role
   */
  async findByRole(role) {
    const sql = `SELECT * FROM ${this.tableName} WHERE role = ?`;
    return await this.query(sql, [role]);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user with ID
   */
  async create(userData) {
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...userData
    };
  }

  /**
   * Update user data
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, userData) {
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Check if email already exists
   * @param {string} email - Email to check
   * @param {number} excludeId - Optional user ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeId = null) {
    let sql = `SELECT 1 FROM ${this.tableName} WHERE email = ?`;
    const params = [email];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await this.query(sql, params);
    return results.length > 0;
  }

  /**
   * Get all students (users with role 'student')
   * @returns {Promise<Array>} Array of student users
   */
  async getAllStudents() {
    return await this.findByRole('student');
  }

  /**
   * Get all teachers (users with role 'teacher')
   * @returns {Promise<Array>} Array of teacher users
   */
  async getAllTeachers() {
    return await this.findByRole('teacher');
  }
}

module.exports = UserRepository;
