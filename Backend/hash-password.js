/**
 * Simple script to hash passwords from command line
 * Usage: node hash-password.js "your_password_here"
 */

const { hashPassword } = require('./utils/password');

async function main() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node hash-password.js "your_password_here"');
    console.log('Example: node hash-password.js "Test123!"');
    process.exit(1);
  }
  
  try {
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('\nOriginal password:', password);
    console.log('Hashed password:', hashedPassword);
    console.log('\nYou can use this hash in your SQL INSERT statements.');
  } catch (error) {
    console.error('Error hashing password:', error.message);
    process.exit(1);
  }
}

main();