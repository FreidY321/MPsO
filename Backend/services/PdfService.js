const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const UserRepository = require('../repositories/UserRepository');
const ClassRepository = require('../repositories/ClassRepository');

class PdfService {
  constructor() {
    this.studentBookRepository = new StudentBookRepository();
    this.userRepository = new UserRepository();
    this.classRepository = new ClassRepository();
  }

  /**
   * Generate PDF for student reading list
   * @param {number} studentId - Student ID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateReadingListPdf(studentId) {
    const pdfBuffer = await this._createPdfDocumentWithPuppeteer(studentId);
    return pdfBuffer;
  }

  /**
   * Create PDF document using Puppeteer with HTML template
   * @param {number} studentId - Student ID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async _createPdfDocumentWithPuppeteer(studentId) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Get student data
    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new Error('Student nenalezen');
    }

    // Get class students sorted by surname, name
    const classStudents = await this.classRepository.getStudentsByClassId(student.class_id);
    const idx = classStudents.findIndex(s => s.id === studentId);
    // We add 1 because array index starts from zero
    const studentPosition = idx === -1 ? " " : idx + 1;

    // Get student's reading list
    const books = await this.studentBookRepository.findByStudentId(studentId);

    // Read HTML template
    const templatePath = path.join(__dirname, '..', 'templates', 'reading-list.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Get absolute path to logo and encode as base64
    const logoPath = path.join(__dirname, '..', 'logo-spsei.png');
    const logoBase64 = fs.readFileSync(logoPath, 'base64');
    const logoMimeType = 'image/png'; // nebo 'image/jpeg' podle vašeho obrázku
    const logoUrl = `data:${logoMimeType};base64,${logoBase64}`;

    // Format student full name
    const studentFullName = [student.name, student.second_name, student.surname, student.second_surname]
      .filter(Boolean)
      .join(' ');

    const studentsClass = await this.classRepository.findById(student.class_id);
    // Format class name
    const className = studentsClass.name ? studentsClass.name : '';

    // Generate books table rows
    const booksTableRows = books.map((book, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${book.id_book}</td>
        <td class="book-author">${this.formatAuthor(book)}</td>
        <td class="book-title">${this.escapeHtml(book.book_name)}</td>
      </tr>
    `).join('');

    // Replace placeholders
    html = html
      .replace('{studentFullName}', studentFullName)
      .replace('{className}', className)
      .replace('{studentPosition}', studentPosition)
      .replace('{booksTableRows}', booksTableRows)
      .replace('{todaysDate}', new Date().toLocaleDateString('cs-CZ'))
      .replace('{schoolLogo}', logoUrl)

    await page.setContent(html, {waitUntil: "networkidle0"});
    const pdfData = await page.pdf();

    await browser.close();

    return Buffer.from(pdfData);
  }

  /**
   * Format author name
   * @param {Object} book - Book object with author info
   * @returns {string} Formatted author name
   */
  formatAuthor(book) {
    const parts = [
      book.author_second_name,
      book.author_name,
      book.author_second_surname,
      book.author_surname
    ].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = PdfService;
