/**
 * Script to create test accounts for the application
 * Run with: node create-test-accounts.js
 */

const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

const SALT_ROUNDS = 10;

async function createTestAccounts() {
  let connection;
  try {
    console.log('Creating test accounts...\n');

    connection = await pool.getConnection();

    // Test password for all accounts: Test123!
    const testPassword = 'Test123!';
    const hashedPassword = await bcrypt.hash(testPassword, SALT_ROUNDS);

    // 1. Create test class first
    const [classResult] = await connection.query(
      `INSERT INTO Classes (name, year_ended, deadline) 
       VALUES (?, ?, ?)`,
      ['4.A', 2025, '2025-06-30 23:59:59']
    );
    const classId = classResult.insertId;
    console.log(`✓ Created test class: 4.A (ID: ${classId})`);

    // 2. Create admin account
    const [adminResult] = await connection.query(
      `INSERT INTO Users (role, name, surname, email, password) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'Admin', 'Testovací', 'admin@test.cz', hashedPassword]
    );
    console.log(`✓ Created admin account:`);
    console.log(`   Email: admin@test.cz`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${adminResult.insertId}\n`);

    // 3. Create teacher account
    const [teacherResult] = await connection.query(
      `INSERT INTO Users (role, degree, name, surname, email, password) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['teacher', 'Mgr.', 'Jana', 'Nováková', 'teacher@test.cz', hashedPassword]
    );
    const teacherId = teacherResult.insertId;
    console.log(`✓ Created teacher account:`);
    console.log(`   Email: teacher@test.cz`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   ID: ${teacherId}\n`);

    // 4. Assign teacher to class
    await connection.query(
      `UPDATE Classes SET cj_teacher = ? WHERE id = ?`,
      [teacherId, classId]
    );
    console.log(`✓ Assigned teacher to class 4.A\n`);

    // 5. Create student account
    const [studentResult] = await connection.query(
      `INSERT INTO Users (role, name, surname, email, password, class_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['student', 'Petr', 'Novák', 'student@test.cz', hashedPassword, classId]
    );
    console.log(`✓ Created student account:`);
    console.log(`   Email: student@test.cz`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Class: 4.A`);
    console.log(`   ID: ${studentResult.insertId}\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('Test accounts created successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nYou can now login with:');
    console.log('\n1. ADMIN:');
    console.log('   Email: admin@test.cz');
    console.log('   Password: Test123!');
    console.log('\n2. TEACHER:');
    console.log('   Email: teacher@test.cz');
    console.log('   Password: Test123!');
    console.log('\n3. STUDENT:');
    console.log('   Email: student@test.cz');
    console.log('   Password: Test123!');
    console.log('═══════════════════════════════════════════════════\n');

    if (connection) connection.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test accounts:', error);
    if (connection) connection.release();
    await pool.end();
    process.exit(1);
  }
}

createTestAccounts();
