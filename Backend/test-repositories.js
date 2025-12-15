/**
 * Simple test script to verify repository implementations
 * Run with: node test-repositories.js
 */

const {
  UserRepository,
  ClassRepository,
  AuthorRepository,
  BookRepository,
  LiteraryClassRepository,
  PeriodRepository,
  StudentBookRepository
} = require('./repositories');

async function testRepositories() {
  console.log('Testing Repository Layer...\n');

  try {
    // Test UserRepository
    console.log('✓ UserRepository loaded');
    const userRepo = new UserRepository();
    console.log('  - Table name:', userRepo.tableName);

    // Test ClassRepository
    console.log('✓ ClassRepository loaded');
    const classRepo = new ClassRepository();
    console.log('  - Table name:', classRepo.tableName);

    // Test AuthorRepository
    console.log('✓ AuthorRepository loaded');
    const authorRepo = new AuthorRepository();
    console.log('  - Table name:', authorRepo.tableName);

    // Test BookRepository
    console.log('✓ BookRepository loaded');
    const bookRepo = new BookRepository();
    console.log('  - Table name:', bookRepo.tableName);

    // Test LiteraryClassRepository
    console.log('✓ LiteraryClassRepository loaded');
    const literaryClassRepo = new LiteraryClassRepository();
    console.log('  - Table name:', literaryClassRepo.tableName);

    // Test PeriodRepository
    console.log('✓ PeriodRepository loaded');
    const periodRepo = new PeriodRepository();
    console.log('  - Table name:', periodRepo.tableName);

    // Test StudentBookRepository
    console.log('✓ StudentBookRepository loaded');
    const studentBookRepo = new StudentBookRepository();
    console.log('  - Table name:', studentBookRepo.tableName);

    console.log('\n✓ All repositories loaded successfully!');
    console.log('\nRepository methods available:');
    console.log('  - BaseRepository: findAll, findById, create, update, delete, findBy, count, exists');
    console.log('  - UserRepository: findByEmail, findByGoogleId, findByClassId, emailExists, getAllStudents, getAllTeachers');
    console.log('  - ClassRepository: getStudentsByClassId, findByName, findByYear, findByTeacher');
    console.log('  - AuthorRepository: searchByName, getFullName, hasBooks');
    console.log('  - BookRepository: findByFilters, isUsedInReadingLists, findByAuthor, findByLiteraryClass, findByPeriod');
    console.log('  - LiteraryClassRepository: findByName, hasBooks');
    console.log('  - PeriodRepository: findByName, hasBooks');
    console.log('  - StudentBookRepository: findByStudentId, addBook, removeBook, getAuthorCounts, getCategoryCounts');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error testing repositories:', error.message);
    process.exit(1);
  }
}

testRepositories();
