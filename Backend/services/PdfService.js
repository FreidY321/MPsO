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

    // Keep a single browser instance for the lifetime of the service to avoid
    // the heavy cost of launching Chromium for every PDF.
    // Shared static properties are used to avoid multiple instances when
    // PdfService is constructed multiple times.
    if (!PdfService._browserLaunchingPromise) PdfService._browserLaunchingPromise = null;
    if (!PdfService._browser) PdfService._browser = null;

    // Limit the number of concurrent pages to avoid exhausting resources.
    // Tune this value according to your environment (CPU/memory).
    this.maxConcurrentPages = 6;
    if (!PdfService._activePages) PdfService._activePages = 0;

    // Track whether we've registered process signal handlers to close the
    // shared browser on exit. Use a static flag to avoid multiple handlers.
    if (typeof PdfService._shutdownHandlerRegistered === 'undefined') PdfService._shutdownHandlerRegistered = false;
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
    const browser = await this._getBrowser();

    // Wait for a free page slot if we reached concurrency limit.
    await this._waitForPageSlot();
    PdfService._activePages += 1;

    const page = await browser.newPage();
    // Smaller viewport can be faster; adjust if you need different sizing.
    await page.setViewport({ width: 800, height: 1120 });

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

    // The HTML template uses embedded base64 images and no remote resources,
    // so we can avoid waiting for networkidle0 which is slower. Use
    // 'domcontentloaded' or 'load' depending on your template needs.
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      preferCSSPageSize: true,
    });

    // Close page to free memory; keep browser running for reuse.
    try {
      await page.close();
    } catch (err) {
      // ignore page close errors
    }
    PdfService._activePages -= 1;

    return Buffer.from(pdfData);
  }

  // Lazily launch a single browser instance and return it. Uses a launching
  // promise to avoid races when multiple callers attempt to get the browser
  // at the same time.
  async _getBrowser() {
    if (PdfService._browser) return PdfService._browser;
    if (PdfService._browserLaunchingPromise) return PdfService._browserLaunchingPromise;

    PdfService._browserLaunchingPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-networking',
        '--disable-component-update'
      ],
    }).then(browser => {
      PdfService._browser = browser;
      // Register graceful shutdown handlers once.
      if (!PdfService._shutdownHandlerRegistered) {
        const closeBrowser = () => {
          try {
            if (PdfService._browser) PdfService._browser.close().catch(() => {});
          } catch (e) {
            // ignore
          }
        };
        process.once('exit', closeBrowser);
        process.once('SIGINT', () => { closeBrowser(); process.exit(0); });
        process.once('SIGTERM', () => { closeBrowser(); process.exit(0); });
        PdfService._shutdownHandlerRegistered = true;
      }
      // When browser disconnects, clear the reference so new launch can happen.
      browser.once('disconnected', () => {
        PdfService._browser = null;
      });
      PdfService._browserLaunchingPromise = null;
      return browser;
    }).catch(err => {
      PdfService._browserLaunchingPromise = null;
      throw err;
    });

    return PdfService._browserLaunchingPromise;
  }

  async _waitForPageSlot() {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    while (PdfService._activePages >= this.maxConcurrentPages) {
      // small sleep; tune as necessary
      // This simple polling avoids adding extra dependencies.
      // If desired, you can replace this with a proper semaphore implementation.
      // eslint-disable-next-line no-await-in-loop
      await sleep(50);
    }
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
    if (text === null || typeof text === 'undefined') return '';
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = PdfService;
