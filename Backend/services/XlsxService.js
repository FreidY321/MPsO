const ExcelJS = require('exceljs');
const path = require('path');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const UserRepository = require('../repositories/UserRepository');
const ClassRepository = require('../repositories/ClassRepository');

class XlsxService {
  constructor() {
    this.studentBookRepository = new StudentBookRepository();
    this.userRepository = new UserRepository();
    this.classRepository = new ClassRepository();
  }

  /**
   * Generate XLSX for all students in a class
   * @param {number} classId - Class ID
   * @returns {Promise<Buffer>} XLSX buffer
   */
  async generateClassReadingListXlsx(classId) {
    const classData = await this.classRepository.findById(classId);
    if (!classData) {
      throw new Error('Třída nenalezena');
    }

    // Get all students in the class
    const students = await this.classRepository.getStudentsByClassId(classId);

    // Prepare data for XLSX (async)
    const { header, rows } = await this._prepareWorksheetData(students);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Maturitní četba';
    workbook.lastModifiedBy = 'Maturitní četba';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add worksheet
    const worksheet = workbook.addWorksheet(`Třída ${classData.name}`);

    // Add header row
    worksheet.addRow(header);

    // Add data rows
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Freeze first row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  }

  /**
   * Prepare worksheet data
   * @param {Array} students - Array of student objects
   * @returns {Object} { header, rows, bookCount }
   */
  async _prepareWorksheetData(students) {
    const header = ['Email', 'Jméno', 'Třída'];

    for (let i = 0; i <= 20; i++) {
      header.push(`O${i}`);
    }

    // Prepare data rows
    const rows = [];

    // Use Promise.all to wait for all students to be processed
    await Promise.all(students.map(async student => {
      const books = await this.studentBookRepository.findByStudentId(student.id);
      const studentFullName = [student.name, student.second_name, student.surname, student.second_surname]
        .filter(Boolean)
        .join(' ');

      
      const studentClass = await this.classRepository.findById(student.class_id);
      
      const row = [
        student.email || '',
        studentFullName,
        studentClass.name
      ];

      books.forEach(book => {
        const author = this._formatAuthor(book);
        const literaryClass = book.literary_class_name.substring(0, 2).toUpperCase();
        const bookInfo = `${book.id_book} ${author} ${book.book_name} - ${literaryClass}`;
        row.push(bookInfo);
      });

      rows.push(row);
    }));

    return { header, rows };
  }

  /**
   * Format author name with initials
   * @param {Object} book - Book object with author info
   * @returns {string} Formatted author name with initials
   */
  _formatAuthor(book) {
    const parts = [];
    
    // First name (initial)
    if (book.author_name) {
     parts.push(book.author_name.charAt(0).toUpperCase() + '.');
    }
    
    // Second name (initial)
    if (book.author_second_name) {
      parts.push(book.author_second_name.charAt(0).toUpperCase() + '.');
    }
    
    // Surname
    if (book.author_surname) {
      parts.push(book.author_surname);
    }
    
    // Second surname
    if (book.author_second_surname) {
      parts.push(book.author_second_surname);
    }
    
    return parts.join(' ').replaceAll("  "," ");
  }
}

module.exports = XlsxService;
