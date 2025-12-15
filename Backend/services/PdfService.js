const PDFDocument = require('pdfkit');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const UserRepository = require('../repositories/UserRepository');
const ClassRepository = require('../repositories/ClassRepository');

/**
 * PdfService handles PDF generation for reading lists
 * Generates A4 formatted documents with headers, footers, and ordered book lists
 */
class PdfService {
  constructor() {
    this.studentBookRepository = new StudentBookRepository();
    this.userRepository = new UserRepository();
    this.classRepository = new ClassRepository();
    
    // A4 dimensions in points (72 points per inch)
    this.pageWidth = 595.28;  // 210mm
    this.pageHeight = 841.89; // 297mm
    this.margin = 50;
  }

  /**
   * Generate PDF for a student's reading list
   * @param {number} studentId - Student user ID
   * @returns {Promise<PDFDocument>} PDF document stream
   */
  async generateReadingListPdf(studentId) {
    // Fetch student data
    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Fetch class data
    let classData = null;
    if (student.class_id) {
      classData = await this.classRepository.findById(student.class_id);
    }

    // Fetch reading list with books ordered by literary_class and period
    const books = await this.studentBookRepository.findByStudentId(studentId);

    // Create PDF document with A4 size
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.margin,
        bottom: this.margin,
        left: this.margin,
        right: this.margin
      }
    });

    // Add header
    this._addHeader(doc, student, classData);

    // Add books list
    this._addBooksList(doc, books);

    // Add footer
    this._addFooter(doc);

    // Finalize PDF
    doc.end();

    return doc;
  }

  /**
   * Add header to PDF with school logo, student name, and class
   * @param {PDFDocument} doc - PDF document
   * @param {Object} student - Student data
   * @param {Object} classData - Class data
   */
  _addHeader(doc, student, classData) {
    const startY = doc.y;

    // School logo placeholder (text for now since we don't have actual logo)
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('ŠKOLA LOGO', this.margin, startY, { align: 'center' });

    doc.moveDown(0.5);

    // Student name with degree
    const studentName = [
      student.degree,
      student.name,
      student.seccond_name,
      student.surname,
      student.second_surname
    ].filter(Boolean).join(' ');

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(studentName, { align: 'center' });

    // Class name
    if (classData) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Třída: ${classData.name}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Seznam povinné četby', { align: 'center' });

    doc.moveDown(1.5);
  }

  /**
   * Add books list to PDF, ordered by literary_class and period
   * @param {PDFDocument} doc - PDF document
   * @param {Array} books - Array of books
   */
  _addBooksList(doc, books) {
    if (books.length === 0) {
      doc.fontSize(12)
         .font('Helvetica')
         .text('Žádné knihy v seznamu četby.', { align: 'center' });
      return;
    }

    // Group books by literary_class and period
    const groupedBooks = this._groupBooks(books);

    let bookNumber = 1;

    // Iterate through literary classes
    Object.keys(groupedBooks).sort().forEach(literaryClassName => {
      const periods = groupedBooks[literaryClassName];

      // Literary class header
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(literaryClassName, this.margin, doc.y);
      
      doc.moveDown(0.5);

      // Iterate through periods within this literary class
      Object.keys(periods).sort().forEach(periodName => {
        const booksInPeriod = periods[periodName];

        // Period subheader
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`  ${periodName}`, this.margin + 10, doc.y);
        
        doc.moveDown(0.3);

        // List books in this period
        booksInPeriod.forEach(book => {
          const authorName = [
            book.author_name,
            book.author_second_name,
            book.author_surname,
            book.author_second_surname
          ].filter(Boolean).join(' ');

          const bookLine = `    ${bookNumber}. ${book.book_name} - ${authorName}`;
          
          doc.fontSize(11)
             .font('Helvetica')
             .text(bookLine, this.margin + 20, doc.y);
          
          doc.moveDown(0.3);
          bookNumber++;
        });

        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    });
  }

  /**
   * Group books by literary_class and period
   * @param {Array} books - Array of books
   * @returns {Object} Nested object: { literaryClass: { period: [books] } }
   */
  _groupBooks(books) {
    const grouped = {};

    books.forEach(book => {
      const literaryClass = book.literary_class_name;
      const period = book.period_name;

      if (!grouped[literaryClass]) {
        grouped[literaryClass] = {};
      }

      if (!grouped[literaryClass][period]) {
        grouped[literaryClass][period] = [];
      }

      grouped[literaryClass][period].push(book);
    });

    return grouped;
  }

  /**
   * Add footer to PDF with print date and signature space
   * @param {PDFDocument} doc - PDF document
   */
  _addFooter(doc) {
    const bottomY = this.pageHeight - this.margin - 80;

    // Move to footer position
    doc.y = bottomY;

    // Print date
    const printDate = new Date().toLocaleDateString('cs-CZ');
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Datum tisku: ${printDate}`, this.margin, doc.y);

    doc.moveDown(2);

    // Signature lines
    const signatureY = doc.y;
    const leftX = this.margin;
    const rightX = this.pageWidth / 2 + 20;

    doc.fontSize(10)
       .font('Helvetica')
       .text('_________________________', leftX, signatureY)
       .text('Podpis žáka', leftX, signatureY + 20);

    doc.text('_________________________', rightX, signatureY)
       .text('Podpis učitele', rightX, signatureY + 20);
  }
}

module.exports = PdfService;
