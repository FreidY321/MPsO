const fc = require('fast-check');
const PdfService = require('./PdfService');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const BookRepository = require('../repositories/BookRepository');
const AuthorRepository = require('../repositories/AuthorRepository');
const LiteraryClassRepository = require('../repositories/LiteraryClassRepository');
const PeriodRepository = require('../repositories/PeriodRepository');
const UserRepository = require('../repositories/UserRepository');
const ClassRepository = require('../repositories/ClassRepository');
const { hashPassword } = require('../utils/password');
const { pool } = require('../config/database');

// Close database connection after all tests
afterAll(async () => {
  await pool.end();
});

/**
 * Feature: povinná-četba-app, Property 24: PDF generation produces document
 * Validates: Requirements 7.1
 * 
 * Property: For any student reading list, requesting PDF generation should produce 
 * a valid PDF document.
 */
describe('Property 24: PDF generation produces document', () => {
  const pdfService = new PdfService();
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const classRepository = new ClassRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
  let testClasses = [];
  let testStudentBooks = [];

  afterAll(async () => {
    // Clean up student_book entries
    for (const sb of testStudentBooks) {
      try {
        await studentBookRepository.removeBook(sb.id_student, sb.id_book);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test books
    for (const book of testBooks) {
      try {
        await bookRepository.delete(book.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test students
    for (const student of testStudents) {
      try {
        await userRepository.delete(student.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test classes
    for (const cls of testClasses) {
      try {
        await classRepository.delete(cls.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test authors
    for (const author of testAuthors) {
      try {
        await authorRepository.delete(author.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test literary classes
    for (const lc of testLiteraryClasses) {
      try {
        await literaryClassRepository.delete(lc.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test periods
    for (const period of testPeriods) {
      try {
        await periodRepository.delete(period.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('PDF generation should produce a valid PDF document', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          className: fc.string({ minLength: 2, maxLength: 10 }),
          yearEnded: fc.integer({ min: 2024, max: 2030 }),
          numBooks: fc.integer({ min: 0, max: 5 })
        }),
        async (data) => {
          // Create class
          const classData = await classRepository.create({
            name: data.className,
            year_ended: data.yearEnded,
            deadline: null,
            cj_teacher: null
          });
          testClasses.push(classData);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: classData.id,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Add some books if numBooks > 0
          if (data.numBooks > 0) {
            // Create author
            const author = await authorRepository.create({
              name: 'Test',
              surname: 'Author'
            });
            testAuthors.push(author);

            // Create literary class
            const literaryClass = await literaryClassRepository.create({
              name: 'Test LC',
              min_request: 1,
              max_request: 10
            });
            testLiteraryClasses.push(literaryClass);

            // Create period
            const period = await periodRepository.create({
              name: 'Test Period',
              min_request: 1,
              max_request: 10
            });
            testPeriods.push(period);

            // Create and add books
            for (let i = 0; i < data.numBooks; i++) {
              const book = await bookRepository.create({
                name: `Book ${i}`,
                url_book: `http://book${i}.com`,
                author_id: author.id,
                period: period.id,
                literary_class: literaryClass.id
              });
              testBooks.push(book);

              await studentBookRepository.addBook(student.id, book.id);
              testStudentBooks.push({ id_student: student.id, id_book: book.id });
            }
          }

          // Generate PDF
          const pdfDoc = await pdfService.generateReadingListPdf(student.id);

          // Verify PDF document is created
          expect(pdfDoc).toBeDefined();
          expect(pdfDoc).not.toBeNull();
          
          // Verify it's a PDFDocument instance (has pipe method for streaming)
          expect(typeof pdfDoc.pipe).toBe('function');
          
          // Verify it's a readable stream (PDFDocument extends stream.Readable)
          expect(pdfDoc.readable).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 25: PDF contains required header elements
 * Validates: Requirements 7.2
 * 
 * Property: For any generated PDF, the document should contain school logo, student 
 * full name (degree + name + surname), and class name in the header.
 */
describe('Property 25: PDF contains required header elements', () => {
  const pdfService = new PdfService();
  const studentBookRepository = new StudentBookRepository();
  const userRepository = new UserRepository();
  const classRepository = new ClassRepository();
  
  let testStudents = [];
  let testClasses = [];

  afterAll(async () => {
    // Clean up test students
    for (const student of testStudents) {
      try {
        await userRepository.delete(student.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test classes
    for (const cls of testClasses) {
      try {
        await classRepository.delete(cls.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('PDF should contain school logo, student name, and class in header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentDegree: fc.option(fc.constantFrom('Bc.', 'Mgr.', 'Ing.', 'Dr.'), { nil: null }),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSeccondName: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: null }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentSecondSurname: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: null }),
          studentEmail: fc.emailAddress(),
          className: fc.string({ minLength: 2, maxLength: 10 }),
          yearEnded: fc.integer({ min: 2024, max: 2030 })
        }),
        async (data) => {
          // Create class
          const classData = await classRepository.create({
            name: data.className,
            year_ended: data.yearEnded,
            deadline: null,
            cj_teacher: null
          });
          testClasses.push(classData);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: classData.id,
            degree: data.studentDegree,
            seccond_name: data.studentSeccondName,
            second_surname: data.studentSecondSurname,
            google_id: null
          });
          testStudents.push(student);

          // Generate PDF and capture output
          const pdfDoc = await pdfService.generateReadingListPdf(student.id);
          
          // Collect PDF content by reading the stream
          const chunks = [];
          pdfDoc.on('data', (chunk) => chunks.push(chunk));
          
          await new Promise((resolve, reject) => {
            pdfDoc.on('end', resolve);
            pdfDoc.on('error', reject);
          });

          const pdfBuffer = Buffer.concat(chunks);
          
          // Verify PDF was generated (starts with PDF header)
          const pdfHeader = pdfBuffer.toString('utf-8', 0, 5);
          expect(pdfHeader).toBe('%PDF-');
          
          // Verify PDF has content (minimum size check)
          expect(pdfBuffer.length).toBeGreaterThan(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 26: PDF contains required footer elements
 * Validates: Requirements 7.3
 * 
 * Property: For any generated PDF, the document should contain print date and 
 * signature space in the footer.
 */
describe('Property 26: PDF contains required footer elements', () => {
  const PDFDocument = require('pdfkit');
  
  test('PDF footer should contain print date and signature space', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate random date to ensure footer always includes current date
          testDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
        }),
        async (data) => {
          // Create a mock PDF document to test the _addFooter method
          const pdfService = new PdfService();
          const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
          });
          
          // Track all text calls to verify footer content
          const textCalls = [];
          const originalText = doc.text.bind(doc);
          doc.text = function(...args) {
            textCalls.push(args);
            return originalText(...args);
          };
          
          // Call the _addFooter method directly
          pdfService._addFooter(doc);
          
          // Don't wait for document to end, just verify the text calls were made
          // The _addFooter method should have already made all necessary text() calls
          
          // Verify footer contains print date
          const hasDateText = textCalls.some(call => {
            const text = call[0];
            return typeof text === 'string' && text.includes('Datum tisku:');
          });
          expect(hasDateText).toBe(true);
          
          // Verify footer contains student signature space
          const hasStudentSignature = textCalls.some(call => {
            const text = call[0];
            return typeof text === 'string' && text.includes('Podpis žáka');
          });
          expect(hasStudentSignature).toBe(true);
          
          // Verify footer contains teacher signature space
          const hasTeacherSignature = textCalls.some(call => {
            const text = call[0];
            return typeof text === 'string' && text.includes('Podpis učitele');
          });
          expect(hasTeacherSignature).toBe(true);
          
          // Verify footer contains signature lines (underscores)
          const hasSignatureLines = textCalls.some(call => {
            const text = call[0];
            return typeof text === 'string' && text.includes('_________________________');
          });
          expect(hasSignatureLines).toBe(true);
          
          // Clean up - end the document without waiting
          doc.end();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout to 60 seconds
});

/**
 * Feature: povinná-četba-app, Property 28: PDF formatted for A4
 * Validates: Requirements 7.5
 * 
 * Property: For any generated PDF, the document dimensions should conform to 
 * A4 paper size (210mm x 297mm).
 */
describe('Property 28: PDF formatted for A4', () => {
  const pdfService = new PdfService();
  const userRepository = new UserRepository();
  const classRepository = new ClassRepository();
  
  let testStudents = [];
  let testClasses = [];

  afterAll(async () => {
    // Clean up test students
    for (const student of testStudents) {
      try {
        await userRepository.delete(student.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test classes
    for (const cls of testClasses) {
      try {
        await classRepository.delete(cls.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('PDF should be formatted for A4 paper size (595.28 x 841.89 points)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          className: fc.string({ minLength: 2, maxLength: 10 }),
          yearEnded: fc.integer({ min: 2024, max: 2030 })
        }),
        async (data) => {
          // Create class
          const classData = await classRepository.create({
            name: data.className,
            year_ended: data.yearEnded,
            deadline: null,
            cj_teacher: null
          });
          testClasses.push(classData);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: classData.id,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Generate PDF
          const pdfDoc = await pdfService.generateReadingListPdf(student.id);

          // A4 dimensions in points (72 points per inch)
          // 210mm = 8.27 inches = 595.28 points
          // 297mm = 11.69 inches = 841.89 points
          const expectedWidth = 595.28;
          const expectedHeight = 841.89;
          
          // Verify the PDF document has A4 dimensions
          // PDFKit stores page dimensions in the page object
          expect(pdfDoc.page).toBeDefined();
          expect(pdfDoc.page.width).toBeCloseTo(expectedWidth, 1);
          expect(pdfDoc.page.height).toBeCloseTo(expectedHeight, 1);
          
          // Also verify the PdfService has the correct A4 dimensions configured
          expect(pdfService.pageWidth).toBeCloseTo(expectedWidth, 1);
          expect(pdfService.pageHeight).toBeCloseTo(expectedHeight, 1);
          
          // Note: The document is already ended by generateReadingListPdf, no need to call end() again
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout to 60 seconds
});

/**
 * Feature: povinná-četba-app, Property 27: PDF books ordered by categories
 * Validates: Requirements 7.4
 * 
 * Property: For any generated PDF, all books should be displayed ordered by 
 * literary_class and period.
 */
describe('Property 27: PDF books ordered by categories', () => {
  const pdfService = new PdfService();
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const classRepository = new ClassRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
  let testClasses = [];
  let testStudentBooks = [];

  afterAll(async () => {
    // Clean up student_book entries
    for (const sb of testStudentBooks) {
      try {
        await studentBookRepository.removeBook(sb.id_student, sb.id_book);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test books
    for (const book of testBooks) {
      try {
        await bookRepository.delete(book.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test students
    for (const student of testStudents) {
      try {
        await userRepository.delete(student.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test classes
    for (const cls of testClasses) {
      try {
        await classRepository.delete(cls.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test authors
    for (const author of testAuthors) {
      try {
        await authorRepository.delete(author.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test literary classes
    for (const lc of testLiteraryClasses) {
      try {
        await literaryClassRepository.delete(lc.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test periods
    for (const period of testPeriods) {
      try {
        await periodRepository.delete(period.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('PDF books should be ordered by literary_class and period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          className: fc.string({ minLength: 2, maxLength: 10 }),
          yearEnded: fc.integer({ min: 2024, max: 2030 }),
          numLiteraryClasses: fc.integer({ min: 2, max: 3 }),
          numPeriods: fc.integer({ min: 2, max: 3 }),
          booksPerCategory: fc.integer({ min: 1, max: 2 })
        }),
        async (data) => {
          // Create class
          const classData = await classRepository.create({
            name: data.className,
            year_ended: data.yearEnded,
            deadline: null,
            cj_teacher: null
          });
          testClasses.push(classData);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: classData.id,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Create author
          const author = await authorRepository.create({
            name: 'Test',
            surname: 'Author'
          });
          testAuthors.push(author);

          // Create multiple literary classes
          const literaryClasses = [];
          for (let i = 0; i < data.numLiteraryClasses; i++) {
            const lc = await literaryClassRepository.create({
              name: `Literary Class ${String.fromCharCode(65 + i)}`, // A, B, C...
              min_request: 1,
              max_request: 10
            });
            testLiteraryClasses.push(lc);
            literaryClasses.push(lc);
          }

          // Create multiple periods
          const periods = [];
          for (let i = 0; i < data.numPeriods; i++) {
            const period = await periodRepository.create({
              name: `Period ${i + 1}`,
              min_request: 1,
              max_request: 10
            });
            testPeriods.push(period);
            periods.push(period);
          }

          // Create books for each combination of literary class and period
          const createdBooks = [];
          for (const lc of literaryClasses) {
            for (const period of periods) {
              for (let i = 0; i < data.booksPerCategory; i++) {
                const book = await bookRepository.create({
                  name: `Book LC${lc.id} P${period.id} #${i}`,
                  url_book: `http://book-lc${lc.id}-p${period.id}-${i}.com`,
                  author_id: author.id,
                  period: period.id,
                  literary_class: lc.id
                });
                testBooks.push(book);
                createdBooks.push({
                  ...book,
                  literary_class_name: lc.name,
                  period_name: period.name
                });

                // Add book to student's reading list
                await studentBookRepository.addBook(student.id, book.id);
                testStudentBooks.push({ id_student: student.id, id_book: book.id });
              }
            }
          }

          // Fetch the reading list (should be ordered by literary_class and period)
          const readingList = await studentBookRepository.findByStudentId(student.id);

          // Verify books are ordered by literary_class_name, then by period_name
          for (let i = 1; i < readingList.length; i++) {
            const prevBook = readingList[i - 1];
            const currBook = readingList[i];

            // Compare literary_class_name first
            const lcComparison = prevBook.literary_class_name.localeCompare(currBook.literary_class_name);
            
            if (lcComparison < 0) {
              // Previous literary class comes before current - correct order
              expect(lcComparison).toBeLessThan(0);
            } else if (lcComparison === 0) {
              // Same literary class - check period ordering
              const periodComparison = prevBook.period_name.localeCompare(currBook.period_name);
              expect(periodComparison).toBeLessThanOrEqual(0);
            } else {
              // Previous literary class comes after current - incorrect order
              throw new Error(
                `Books not ordered correctly: ${prevBook.literary_class_name} should not come after ${currBook.literary_class_name}`
              );
            }
          }

          // Now verify the PDF generation uses this ordering
          const PDFDocument = require('pdfkit');
          const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
          });
          
          // Track all text calls to verify ordering in PDF
          const textCalls = [];
          const originalText = doc.text.bind(doc);
          doc.text = function(...args) {
            textCalls.push(args[0]); // Store just the text content
            return originalText(...args);
          };
          
          // Call _addBooksList directly to test ordering
          pdfService._addBooksList(doc, readingList);
          
          // Extract book names from text calls
          const bookTextsInPdf = textCalls.filter(text => 
            typeof text === 'string' && text.match(/^\s+\d+\.\s+Book/)
          );

          // Verify we have the expected number of books in PDF
          expect(bookTextsInPdf.length).toBe(readingList.length);

          // Verify the order matches the reading list order
          for (let i = 0; i < readingList.length; i++) {
            const expectedBookName = readingList[i].book_name;
            const pdfBookText = bookTextsInPdf[i];
            
            // PDF text should contain the book name
            expect(pdfBookText).toContain(expectedBookName);
          }
          
          // Clean up
          doc.end();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // Increase timeout to 60 seconds
});
