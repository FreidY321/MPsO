const fc = require('fast-check');
const StudentBookRepository = require('../repositories/StudentBookRepository');
const BookRepository = require('../repositories/BookRepository');
const AuthorRepository = require('../repositories/AuthorRepository');
const LiteraryClassRepository = require('../repositories/LiteraryClassRepository');
const PeriodRepository = require('../repositories/PeriodRepository');
const UserRepository = require('../repositories/UserRepository');
const ReadingListService = require('../services/ReadingListService');
const { hashPassword } = require('../utils/password');
const { pool } = require('../config/database');

// Close database connection after all tests
afterAll(async () => {
  await pool.end();
});

/**
 * Feature: povinná-četba-app, Property 16: Adding book updates category counts
 * Validates: Requirements 5.1
 * 
 * Property: For any student reading list and book, adding the book should increment 
 * the count for the book's literary_class and period by exactly one.
 */
describe('Property 16: Adding book updates category counts', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('adding book should increment category counts by exactly one', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookName: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          urlBook: fc.webUrl(),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress()
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(literaryClass);

          // Create period
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(period);

          // Create book
          const book = await bookRepository.create({
            name: data.bookName,
            url_book: data.urlBook,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Get category counts before adding book
          const statusBefore = await readingListService.calculateReadingListStatus(student.id);
          
          const lcBefore = statusBefore.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodBefore = statusBefore.periodProgress.find(p => p.id === period.id);
          
          const lcCountBefore = lcBefore ? lcBefore.currentCount : 0;
          const periodCountBefore = periodBefore ? periodBefore.currentCount : 0;

          // Add book to reading list
          await studentBookRepository.addBook(student.id, book.id);
          testStudentBooks.push({ id_student: student.id, id_book: book.id });

          // Get category counts after adding book
          const statusAfter = await readingListService.calculateReadingListStatus(student.id);
          
          const lcAfter = statusAfter.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodAfter = statusAfter.periodProgress.find(p => p.id === period.id);

          // Verify counts increased by exactly one
          expect(lcAfter.currentCount).toBe(lcCountBefore + 1);
          expect(periodAfter.currentCount).toBe(periodCountBefore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 17: Removing book updates category counts
 * Validates: Requirements 5.2
 * 
 * Property: For any student reading list containing a book, removing the book should 
 * decrement the count for the book's literary_class and period by exactly one.
 */
describe('Property 17: Removing book updates category counts', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('removing book should decrement category counts by exactly one', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookName: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          urlBook: fc.webUrl(),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress()
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(literaryClass);

          // Create period
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(period);

          // Create book
          const book = await bookRepository.create({
            name: data.bookName,
            url_book: data.urlBook,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Add book to reading list
          await studentBookRepository.addBook(student.id, book.id);
          testStudentBooks.push({ id_student: student.id, id_book: book.id });

          // Get category counts before removing book
          const statusBefore = await readingListService.calculateReadingListStatus(student.id);
          
          const lcBefore = statusBefore.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodBefore = statusBefore.periodProgress.find(p => p.id === period.id);

          // Remove book from reading list
          await studentBookRepository.removeBook(student.id, book.id);
          testStudentBooks = testStudentBooks.filter(
            sb => !(sb.id_student === student.id && sb.id_book === book.id)
          );

          // Get category counts after removing book
          const statusAfter = await readingListService.calculateReadingListStatus(student.id);
          
          const lcAfter = statusAfter.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodAfter = statusAfter.periodProgress.find(p => p.id === period.id);

          // Verify counts decreased by exactly one
          expect(lcAfter.currentCount).toBe(lcBefore.currentCount - 1);
          expect(periodAfter.currentCount).toBe(periodBefore.currentCount - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 18: Reading list ordered by categories
 * Validates: Requirements 5.3
 * 
 * Property: For any student reading list, retrieving the list should return all books 
 * ordered by their literary_class and period.
 */
describe('Property 18: Reading list ordered by categories', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('reading list should be ordered by literary_class and period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          literaryClass1: fc.string({ minLength: 3, maxLength: 50 }),
          literaryClass2: fc.string({ minLength: 3, maxLength: 50 }),
          period1: fc.string({ minLength: 3, maxLength: 50 }),
          period2: fc.string({ minLength: 3, maxLength: 50 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          books: fc.array(
            fc.record({
              bookName: fc.string({ minLength: 3, maxLength: 100 }),
              urlBook: fc.webUrl(),
              lcIndex: fc.integer({ min: 0, max: 1 }),
              periodIndex: fc.integer({ min: 0, max: 1 })
            }),
            { minLength: 4, maxLength: 4 }
          )
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary classes
          const lc1 = await literaryClassRepository.create({
            name: data.literaryClass1,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(lc1);

          const lc2 = await literaryClassRepository.create({
            name: data.literaryClass2,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(lc2);

          // Create periods
          const p1 = await periodRepository.create({
            name: data.period1,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(p1);

          const p2 = await periodRepository.create({
            name: data.period2,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(p2);

          const literaryClasses = [lc1, lc2];
          const periods = [p1, p2];

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          const createdBooks = [];

          // Create books and add to student's reading list
          for (const bookData of data.books) {
            const book = await bookRepository.create({
              name: bookData.bookName,
              url_book: bookData.urlBook,
              author_id: author.id,
              period: periods[bookData.periodIndex].id,
              literary_class: literaryClasses[bookData.lcIndex].id
            });
            testBooks.push(book);
            createdBooks.push(book.id);

            await studentBookRepository.addBook(student.id, book.id);
            testStudentBooks.push({ id_student: student.id, id_book: book.id });
          }

          // Retrieve student's reading list
          const readingList = await studentBookRepository.findByStudentId(student.id);

          // Verify we got all books
          expect(readingList.length).toBe(createdBooks.length);

          // Verify ordering: books should be grouped by literary_class and period
          // Books with same literary_class and period should appear together
          const groups = {};
          for (const book of readingList) {
            const key = `${book.literary_class_name}|${book.period_name}`;
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(book);
          }

          // Verify that books appear in groups (same literary_class and period are together)
          let lastKey = null;
          const seenKeys = new Set();
          
          for (const book of readingList) {
            const key = `${book.literary_class_name}|${book.period_name}`;
            
            if (lastKey !== null && lastKey !== key) {
              // We've moved to a new group
              // Verify we haven't seen this group before (groups should not be interleaved)
              expect(seenKeys.has(key)).toBe(false);
            }
            
            seenKeys.add(key);
            lastKey = key;
          }
        }
      ),
      { numRuns: 50, timeout: 60000 }
    );
  }, 90000);
});

/**
 * Feature: povinná-četba-app, Property 19: Reading list changes persist immediately
 * Validates: Requirements 5.4
 * 
 * Property: For any modification to student_book table, querying the list immediately 
 * after should reflect the change.
 */
describe('Property 19: Reading list changes persist immediately', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('reading list changes should persist immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookName: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          urlBook: fc.webUrl(),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress()
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(literaryClass);

          // Create period
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(period);

          // Create book
          const book = await bookRepository.create({
            name: data.bookName,
            url_book: data.urlBook,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Get initial reading list (should be empty)
          const initialList = await studentBookRepository.findByStudentId(student.id);
          expect(initialList.length).toBe(0);

          // Add book to reading list
          await studentBookRepository.addBook(student.id, book.id);
          testStudentBooks.push({ id_student: student.id, id_book: book.id });

          // Query immediately after adding - should reflect the change
          const afterAdd = await studentBookRepository.findByStudentId(student.id);
          expect(afterAdd.length).toBe(1);
          expect(afterAdd[0].id_book).toBe(book.id);

          // Remove book from reading list
          await studentBookRepository.removeBook(student.id, book.id);
          testStudentBooks = testStudentBooks.filter(
            sb => !(sb.id_student === student.id && sb.id_book === book.id)
          );

          // Query immediately after removing - should reflect the change
          const afterRemove = await studentBookRepository.findByStudentId(student.id);
          expect(afterRemove.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 20: Author limit validation
 * Validates: Requirements 6.1, 6.2
 * 
 * Property: For any student reading list and book, if the list already contains two 
 * books by the same author (author_id), attempting to add a third book by that author 
 * should be rejected.
 */
describe('Property 20: Author limit validation', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('adding third book by same author should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          book1Name: fc.string({ minLength: 3, maxLength: 100 }),
          book2Name: fc.string({ minLength: 3, maxLength: 100 }),
          book3Name: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          urlBook1: fc.webUrl(),
          urlBook2: fc.webUrl(),
          urlBook3: fc.webUrl(),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress()
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(literaryClass);

          // Create period
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(period);

          // Create three books by the same author
          const book1 = await bookRepository.create({
            name: data.book1Name,
            url_book: data.urlBook1,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book1);

          const book2 = await bookRepository.create({
            name: data.book2Name,
            url_book: data.urlBook2,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book2);

          const book3 = await bookRepository.create({
            name: data.book3Name,
            url_book: data.urlBook3,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          });
          testBooks.push(book3);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Add first book - should succeed
          const validation1 = await readingListService.validateBookAddition(student.id, book1.id);
          expect(validation1.canAdd).toBe(true);
          await studentBookRepository.addBook(student.id, book1.id);
          testStudentBooks.push({ id_student: student.id, id_book: book1.id });

          // Add second book - should succeed
          const validation2 = await readingListService.validateBookAddition(student.id, book2.id);
          expect(validation2.canAdd).toBe(true);
          await studentBookRepository.addBook(student.id, book2.id);
          testStudentBooks.push({ id_student: student.id, id_book: book2.id });

          // Try to add third book - should be rejected by validation
          const validation3 = await readingListService.validateBookAddition(student.id, book3.id);
          expect(validation3.canAdd).toBe(false);
          expect(validation3.reason).toContain('2 books');
          expect(validation3.reason).toContain('author');

          // Verify the count is still 2
          const authorCount = await studentBookRepository.getAuthorBookCount(student.id, author.id);
          expect(authorCount).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 21: Category count accuracy
 * Validates: Requirements 6.3
 * 
 * Property: For any student reading list, the displayed literary_class and period 
 * counts should equal the actual number of books in each category.
 */
describe('Property 21: Category count accuracy', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('category counts should equal actual number of books', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          literaryClass1: fc.string({ minLength: 3, maxLength: 50 }),
          literaryClass2: fc.string({ minLength: 3, maxLength: 50 }),
          period1: fc.string({ minLength: 3, maxLength: 50 }),
          period2: fc.string({ minLength: 3, maxLength: 50 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          books: fc.array(
            fc.record({
              bookName: fc.string({ minLength: 3, maxLength: 100 }),
              urlBook: fc.webUrl(),
              lcIndex: fc.integer({ min: 0, max: 1 }),
              periodIndex: fc.integer({ min: 0, max: 1 })
            }),
            { minLength: 3, maxLength: 6 }
          )
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary classes
          const lc1 = await literaryClassRepository.create({
            name: data.literaryClass1,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(lc1);

          const lc2 = await literaryClassRepository.create({
            name: data.literaryClass2,
            min_request: 1,
            max_request: 5
          });
          testLiteraryClasses.push(lc2);

          // Create periods
          const p1 = await periodRepository.create({
            name: data.period1,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(p1);

          const p2 = await periodRepository.create({
            name: data.period2,
            min_request: 1,
            max_request: 5
          });
          testPeriods.push(p2);

          const literaryClasses = [lc1, lc2];
          const periods = [p1, p2];

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Track expected counts
          const expectedLcCounts = { [lc1.id]: 0, [lc2.id]: 0 };
          const expectedPeriodCounts = { [p1.id]: 0, [p2.id]: 0 };

          // Create books and add to student's reading list
          for (const bookData of data.books) {
            const book = await bookRepository.create({
              name: bookData.bookName,
              url_book: bookData.urlBook,
              author_id: author.id,
              period: periods[bookData.periodIndex].id,
              literary_class: literaryClasses[bookData.lcIndex].id
            });
            testBooks.push(book);

            await studentBookRepository.addBook(student.id, book.id);
            testStudentBooks.push({ id_student: student.id, id_book: book.id });

            // Update expected counts
            expectedLcCounts[literaryClasses[bookData.lcIndex].id]++;
            expectedPeriodCounts[periods[bookData.periodIndex].id]++;
          }

          // Get status from service
          const status = await readingListService.calculateReadingListStatus(student.id);

          // Verify literary class counts
          const lc1Status = status.literaryClassProgress.find(lc => lc.id === lc1.id);
          const lc2Status = status.literaryClassProgress.find(lc => lc.id === lc2.id);
          
          expect(lc1Status.currentCount).toBe(expectedLcCounts[lc1.id]);
          expect(lc2Status.currentCount).toBe(expectedLcCounts[lc2.id]);

          // Verify period counts
          const p1Status = status.periodProgress.find(p => p.id === p1.id);
          const p2Status = status.periodProgress.find(p => p.id === p2.id);
          
          expect(p1Status.currentCount).toBe(expectedPeriodCounts[p1.id]);
          expect(p2Status.currentCount).toBe(expectedPeriodCounts[p2.id]);

          // Verify total books
          expect(status.totalBooks).toBe(data.books.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 22: Category requirement validation
 * Validates: Requirements 6.4
 * 
 * Property: For any student reading list, the system should correctly identify which 
 * literary_classes and periods do not meet their min_request requirements.
 */
describe('Property 22: Category requirement validation', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('system should identify categories not meeting min requirements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          minRequest: fc.integer({ min: 2, max: 4 }),
          maxRequest: fc.integer({ min: 5, max: 10 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          numBooks: fc.integer({ min: 0, max: 3 }) // Less than minRequest
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class with min requirement
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: data.minRequest,
            max_request: data.maxRequest
          });
          testLiteraryClasses.push(literaryClass);

          // Create period with min requirement
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: data.minRequest,
            max_request: data.maxRequest
          });
          testPeriods.push(period);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Add books (less than minRequest)
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

          // Get status
          const status = await readingListService.calculateReadingListStatus(student.id);

          // Find our categories in the status
          const lcStatus = status.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodStatus = status.periodProgress.find(p => p.id === period.id);

          // Verify counts
          expect(lcStatus.currentCount).toBe(data.numBooks);
          expect(periodStatus.currentCount).toBe(data.numBooks);

          // Verify isSatisfied flag
          if (data.numBooks < data.minRequest) {
            expect(lcStatus.isSatisfied).toBe(false);
            expect(periodStatus.isSatisfied).toBe(false);
            
            // Verify violations are reported
            expect(status.violations.length).toBeGreaterThan(0);
            expect(status.violations.some(v => v.includes(data.literaryClassName))).toBe(true);
            expect(status.violations.some(v => v.includes(data.periodName))).toBe(true);
          } else {
            expect(lcStatus.isSatisfied).toBe(true);
            expect(periodStatus.isSatisfied).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 23: Finalization requires complete categories
 * Validates: Requirements 6.5
 * 
 * Property: For any student reading list, finalization should succeed only if all 
 * literary_classes and periods meet their min_request and do not exceed max_request.
 */
describe('Property 23: Finalization requires complete categories', () => {
  const studentBookRepository = new StudentBookRepository();
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const userRepository = new UserRepository();
  const readingListService = new ReadingListService();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];
  let testStudents = [];
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

  test('finalization should succeed only when all requirements are met', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          minRequest: fc.integer({ min: 2, max: 3 }),
          maxRequest: fc.integer({ min: 4, max: 5 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentName: fc.string({ minLength: 2, maxLength: 50 }),
          studentSurname: fc.string({ minLength: 2, maxLength: 50 }),
          studentEmail: fc.emailAddress(),
          numBooks: fc.integer({ min: 1, max: 6 })
        }),
        async (data) => {
          // Create author
          const author = await authorRepository.create({
            name: data.authorName,
            surname: data.authorSurname
          });
          testAuthors.push(author);

          // Create literary class
          const literaryClass = await literaryClassRepository.create({
            name: data.literaryClassName,
            min_request: data.minRequest,
            max_request: data.maxRequest
          });
          testLiteraryClasses.push(literaryClass);

          // Create period
          const period = await periodRepository.create({
            name: data.periodName,
            min_request: data.minRequest,
            max_request: data.maxRequest
          });
          testPeriods.push(period);

          // Create student
          const hashedPassword = await hashPassword('testpassword123');
          const student = await userRepository.create({
            role: 'student',
            name: data.studentName,
            surname: data.studentSurname,
            email: data.studentEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testStudents.push(student);

          // Add books
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

          // Get status
          const status = await readingListService.calculateReadingListStatus(student.id);

          // Find our specific categories
          const lcStatus = status.literaryClassProgress.find(lc => lc.id === literaryClass.id);
          const periodStatus = status.periodProgress.find(p => p.id === period.id);

          // Determine if OUR categories meet requirements
          const meetsMin = data.numBooks >= data.minRequest;
          const withinMax = data.numBooks <= data.maxRequest;
          const ourCategoriesSatisfied = meetsMin && withinMax;

          // Verify our categories are correctly marked
          expect(lcStatus.isSatisfied).toBe(meetsMin);
          expect(periodStatus.isSatisfied).toBe(meetsMin);
          expect(lcStatus.isOverLimit).toBe(!withinMax);
          expect(periodStatus.isOverLimit).toBe(!withinMax);

          // Validate finalization
          const validation = await readingListService.validateFinalization(student.id);

          // The overall finalization depends on ALL categories in the system
          // We can only verify that if our categories are NOT satisfied, finalization should fail
          if (!ourCategoriesSatisfied) {
            expect(validation.canFinalize).toBe(false);
            expect(validation.status.violations.length).toBeGreaterThan(0);
          }
          // If our categories ARE satisfied, finalization might still fail due to other categories
          // in the database, so we don't assert canFinalize === true
        }
      ),
      { numRuns: 100 }
    );
  });
});
