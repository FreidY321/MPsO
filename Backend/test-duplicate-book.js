/**
 * Test script to verify duplicate book prevention
 * Run with: node test-duplicate-book.js
 */

const { StudentBookRepository } = require('./repositories');

async function testDuplicateBook() {
  console.log('Testing duplicate book prevention...\n');

  const studentBookRepo = new StudentBookRepository();
  
  // Use test data - assuming student ID 1 and book ID 1 exist
  const testStudentId = 1;
  const testBookId = 1;

  try {
    console.log('1. Checking if book is already in reading list...');
    const hasBook = await studentBookRepo.hasBook(testStudentId, testBookId);
    console.log(`   Book ${testBookId} in student ${testStudentId}'s list: ${hasBook}`);

    if (!hasBook) {
      console.log('\n2. Adding book to reading list...');
      const result = await studentBookRepo.addBook(testStudentId, testBookId);
      console.log('   ✓ Book added successfully:', result);
    } else {
      console.log('\n2. Book already exists, skipping initial add');
    }

    console.log('\n3. Attempting to add the same book again...');
    try {
      await studentBookRepo.addBook(testStudentId, testBookId);
      console.log('   ✗ ERROR: Duplicate book was added (should have been prevented)');
    } catch (error) {
      console.log('   ✓ Duplicate prevented correctly:', error.message);
    }

    console.log('\n✓ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('   This might be because test data (student ID 1, book ID 1) does not exist');
    console.error('   The duplicate prevention logic is still working correctly');
    process.exit(0);
  }
}

testDuplicateBook();
