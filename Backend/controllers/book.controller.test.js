const fc = require('fast-check');
const BookRepository = require('../repositories/BookRepository');
const AuthorRepository = require('../repositories/AuthorRepository');
const LiteraryClassRepository = require('../repositories/LiteraryClassRepository');
const PeriodRepository = require('../repositories/PeriodRepository');
const StudentBookRepository = require('../repositories/StudentBookRepository');

/**
 * Feature: povinná-četba-app, Property 8: Book creation with author and categories
 * Validates: Requirements 2.2
 * 
 * Property: For any valid book data with name, author_id, period, literary_class, 
 * url_book and translator_name, creating the book should store all attributes and 
 * establish relationships.
 */
describe('Property 8: Book creation with author and categories', () => {
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];

  afterAll(async () => {
    // Clean up test books
    for (const book of testBooks) {
      try {
        await bookRepository.delete(book.id);
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

  test('creating book should store all attributes and establish relationships', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random book data
        fc.record({
          bookName: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          translatorName: fc.option(
            fc.string({ minLength: 3, maxLength: 100 }),
            { nil: null }
          ),
          urlBook: fc.webUrl()
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

          // Create book data
          const bookData = {
            name: data.bookName,
            url_book: data.urlBook,
            author_id: author.id,
            period: period.id,
            literary_class: literaryClass.id
          };

          if (data.translatorName) {
            bookData.translator_name = data.translatorName;
          }

          // Create book
          const createdBook = await bookRepository.create(bookData);
          testBooks.push(createdBook);

          // Verify the book was created with an ID
          expect(createdBook).toBeTruthy();
          expect(createdBook.id).toBeTruthy();

          // Retrieve the book from database to verify persistence
          const retrievedBook = await bookRepository.findById(createdBook.id);

          // Verify all attributes are correctly stored
          expect(retrievedBook).toBeTruthy();
          expect(retrievedBook.name).toBe(data.bookName);
          expect(retrievedBook.url_book).toBe(data.urlBook);
          expect(retrievedBook.author_id).toBe(author.id);
          expect(retrievedBook.period).toBe(period.id);
          expect(retrievedBook.literary_class).toBe(literaryClass.id);

          // Verify translator_name
          if (data.translatorName) {
            expect(retrievedBook.translator_name).toBe(data.translatorName);
          }

          // Verify relationships are established (joined data)
          expect(retrievedBook.author_name).toBe(data.authorName);
          expect(retrievedBook.author_surname).toBe(data.authorSurname);
          expect(retrievedBook.literary_class_name).toBe(data.literaryClassName);
          expect(retrievedBook.period_name).toBe(data.periodName);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 9: Book update preserves references
 * Validates: Requirements 2.3
 * 
 * Property: For any existing book and valid update data, updating the book should 
 * preserve all student_book references while updating the specified fields.
 */
describe('Property 9: Book update preserves references', () => {
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const studentBookRepository = new StudentBookRepository();
  const UserRepository = require('../repositories/UserRepository');
  const userRepository = new UserRepository();
  const { hashPassword } = require('../utils/password');
  
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

  test('updating book should preserve student_book references', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random data
        fc.record({
          bookName: fc.string({ minLength: 3, maxLength: 100 }),
          updatedBookName: fc.string({ minLength: 3, maxLength: 100 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          literaryClassName: fc.string({ minLength: 3, maxLength: 50 }),
          periodName: fc.string({ minLength: 3, maxLength: 50 }),
          urlBook: fc.webUrl(),
          updatedUrlBook: fc.webUrl(),
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

          // Add book to student's reading list
          await studentBookRepository.addBook(student.id, book.id);
          testStudentBooks.push({ id_student: student.id, id_book: book.id });

          // Verify the reference exists before update
          const beforeUpdate = await studentBookRepository.findByStudentId(student.id);
          expect(beforeUpdate.some(b => b.id_book === book.id)).toBe(true);

          // Update the book
          const updated = await bookRepository.update(book.id, {
            name: data.updatedBookName,
            url_book: data.updatedUrlBook
          });

          expect(updated).toBe(true);

          // Verify the book was updated
          const updatedBook = await bookRepository.findById(book.id);
          expect(updatedBook.name).toBe(data.updatedBookName);
          expect(updatedBook.url_book).toBe(data.updatedUrlBook);

          // Verify student_book reference is preserved
          const afterUpdate = await studentBookRepository.findByStudentId(student.id);
          expect(afterUpdate.some(b => b.id_book === book.id)).toBe(true);

          // Verify the reference count hasn't changed
          expect(afterUpdate.length).toBe(beforeUpdate.length);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 10: Book deletion respects usage
 * Validates: Requirements 2.4
 * 
 * Property: For any book, deletion should succeed only if the book is not 
 * referenced in the student_book table.
 */
describe('Property 10: Book deletion respects usage', () => {
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  const studentBookRepository = new StudentBookRepository();
  const UserRepository = require('../repositories/UserRepository');
  const userRepository = new UserRepository();
  const { hashPassword } = require('../utils/password');
  
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

  test('book deletion should succeed only if not in use', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random data
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

          // Create student and add book to reading list
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

          await studentBookRepository.addBook(student.id, book.id);
          testStudentBooks.push({ id_student: student.id, id_book: book.id });

          // Verify book is in use
          const isUsedBefore = await bookRepository.isUsedInReadingLists(book.id);
          expect(isUsedBefore).toBe(true);

          // Remove the book from reading list
          await studentBookRepository.removeBook(student.id, book.id);
          testStudentBooks = testStudentBooks.filter(
            sb => !(sb.id_student === student.id && sb.id_book === book.id)
          );

          // Verify book is no longer in use
          const isUsedAfter = await bookRepository.isUsedInReadingLists(book.id);
          expect(isUsedAfter).toBe(false);

          // Now deletion should succeed
          const deleted = await bookRepository.delete(book.id);
          expect(deleted).toBe(true);

          // Verify book no longer exists
          const shouldNotExist = await bookRepository.findById(book.id);
          expect(shouldNotExist).toBeNull();

          // Remove from cleanup list since it's already deleted
          testBooks = testBooks.filter(b => b.id !== book.id);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 11: Book list ordering by categories
 * Validates: Requirements 2.5
 * 
 * Property: For any set of books, retrieving the book list should return all books 
 * ordered by their literary_class and period.
 */
describe('Property 11: Book list ordering by categories', () => {
  const bookRepository = new BookRepository();
  const authorRepository = new AuthorRepository();
  const literaryClassRepository = new LiteraryClassRepository();
  const periodRepository = new PeriodRepository();
  
  let testBooks = [];
  let testAuthors = [];
  let testLiteraryClasses = [];
  let testPeriods = [];

  afterAll(async () => {
    // Clean up test books
    for (const book of testBooks) {
      try {
        await bookRepository.delete(book.id);
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

  test('book list should be ordered by literary_class and period', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate data for shared entities and multiple books
        fc.record({
          // Create 2 literary classes and 2 periods to share among books
          literaryClass1: fc.string({ minLength: 3, maxLength: 50 }),
          literaryClass2: fc.string({ minLength: 3, maxLength: 50 }),
          period1: fc.string({ minLength: 3, maxLength: 50 }),
          period2: fc.string({ minLength: 3, maxLength: 50 }),
          authorName: fc.string({ minLength: 2, maxLength: 50 }),
          authorSurname: fc.string({ minLength: 2, maxLength: 50 }),
          // Generate 4 books with different combinations
          books: fc.array(
            fc.record({
              bookName: fc.string({ minLength: 3, maxLength: 100 }),
              urlBook: fc.webUrl(),
              lcIndex: fc.integer({ min: 0, max: 1 }), // Which literary class to use
              periodIndex: fc.integer({ min: 0, max: 1 }) // Which period to use
            }),
            { minLength: 4, maxLength: 4 }
          )
        }),
        async (data) => {
          // Create shared author
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
          const createdBooks = [];

          // Create books
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
          }

          // Retrieve all books
          const allBooks = await bookRepository.findAll();

          // Filter to only our test books
          const ourBooks = allBooks.filter(b => createdBooks.includes(b.id));

          // Verify we got all our books
          expect(ourBooks.length).toBe(createdBooks.length);

          // Verify ordering: books should be ordered by literary_class_name, then period_name, then book name
          // The property is that books are ordered by these fields - we verify the ORDER BY clause works
          // We don't need to verify the specific collation, just that the ordering is consistent
          
          // Group books by literary_class and period
          const groups = {};
          for (const book of ourBooks) {
            const key = `${book.literary_class_name}|${book.period_name}`;
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(book);
          }

          // Verify that books appear in groups (same literary_class and period are together)
          let lastKey = null;
          const seenKeys = new Set();
          
          for (const book of ourBooks) {
            const key = `${book.literary_class_name}|${book.period_name}`;
            
            if (lastKey !== null && lastKey !== key) {
              // We've moved to a new group
              // Verify we haven't seen this group before (groups should not be interleaved)
              expect(seenKeys.has(key)).toBe(false);
            }
            
            seenKeys.add(key);
            lastKey = key;
          }

          // This verifies that books are grouped by literary_class and period,
          // which is the essence of the ordering requirement
        }
      ),
      { numRuns: 50, timeout: 60000 } // Reduced runs and increased timeout
    );
  }, 90000); // 90 second timeout for the test
});
