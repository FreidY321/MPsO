const BaseRepository = require('./BaseRepository');

/**
 * ClassRepository handles all database operations for Classes table
 */
class ClassRepository extends BaseRepository {
  constructor() {
    super('Classes');
  }

  /**
   * Find all classes
   * @returns {Promise<Array>} All classes
   */
  async findAll() {
    const sql = `
      SELECT 
        c.*,
        u.name as teacher_name,
        u.surname as teacher_surname,
        u.degree as teacher_degree
      FROM ${this.tableName} c
      LEFT JOIN Users u ON c.cj_teacher = u.id
    `;
    return await this.query(sql);
  }

  /**
   * Find a class by ID with teacher information
   * @param {number} id - Class ID
   * @returns {Promise<Object|null>} Class with teacher info or null if not found
   */
  async findById(id) {
    const sql = `
      SELECT 
        c.*,
        u.name as teacher_name,
        u.surname as teacher_surname,
        u.degree as teacher_degree
      FROM ${this.tableName} c
      LEFT JOIN Users u ON c.cj_teacher = u.id
      WHERE c.id = ?
    `;
    const results = await this.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new class
   * @param {Object} classData - Class data (name, year_ended, deadline, cj_teacher)
   * @returns {Promise<Object>} Created class with ID
   */
  async create(classData) {
    const fields = Object.keys(classData);
    const values = Object.values(classData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      ...classData
    };
  }

  /**
   * Update class data
   * @param {number} id - Class ID
   * @param {Object} classData - Updated class data
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async update(id, classData) {
    const fields = Object.keys(classData);
    const values = Object.values(classData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Delete a class
   * @param {number} id - Class ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Get all students in a class
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Array of students in the class
   */
  async getStudentsByClassId(classId) {
    const sql = `
      SELECT * FROM Users 
      WHERE class_id = ? AND role = 'student'
      ORDER BY surname, name
    `;
    return await this.query(sql, [classId]);
  }

  /**
   * Get class by name
   * @param {string} name - Class name
   * @returns {Promise<Object|null>} Class or null if not found
   */
  async findByName(name) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
    const results = await this.query(sql, [name]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get classes by year
   * @param {number} year - Year ended
   * @returns {Promise<Array>} Array of classes for the specified year
   */
  async findByYear(year) {
    const sql = `SELECT * FROM ${this.tableName} WHERE year_ended = ?`;
    return await this.query(sql, [year]);
  }

  /**
   * Get classes taught by a specific teacher
   * @param {number} teacherId - Teacher user ID
   * @returns {Promise<Array>} Array of classes taught by the teacher
   */
  async findByTeacher(teacherId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE cj_teacher = ?`;
    return await this.query(sql, [teacherId]);
  }
}

module.exports = ClassRepository;
