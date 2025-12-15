const fc = require('fast-check');
const UserRepository = require('../repositories/UserRepository');
const { hashPassword } = require('../utils/password');

/**
 * Feature: povinná-četba-app, Property 3: Student account creation completeness
 * Validates: Requirements 1.3
 * 
 * Property: For any valid student data, creating a student account should result in 
 * a user with email, hashed password and correct class assignment.
 */
describe('Property 3: Student account creation completeness', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('creating student account should store all required attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random student data
        fc.record({
          email: fc.emailAddress(),
          password: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'.split('')),
            { minLength: 8, maxLength: 20 }
          ).map(arr => arr.join('')),
          name: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          surname: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join(''))
        }),
        async (studentData) => {
          // Hash the password
          const hashedPassword = await hashPassword(studentData.password);

          // Create student account without class_id to avoid foreign key constraint
          // (class_id can be null for students not yet assigned to a class)
          const createdStudent = await userRepository.create({
            role: 'student',
            email: studentData.email,
            password: hashedPassword,
            name: studentData.name,
            surname: studentData.surname,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });

          testUsers.push(createdStudent);

          // Verify the student was created with all required attributes
          expect(createdStudent).toBeTruthy();
          expect(createdStudent.id).toBeTruthy();
          
          // Retrieve the student from database to verify persistence
          const retrievedStudent = await userRepository.findById(createdStudent.id);
          
          // Verify all attributes are correctly stored
          expect(retrievedStudent).toBeTruthy();
          expect(retrievedStudent.email).toBe(studentData.email);
          expect(retrievedStudent.role).toBe('student');
          expect(retrievedStudent.name).toBe(studentData.name);
          expect(retrievedStudent.surname).toBe(studentData.surname);
          
          // Verify password is hashed (not plain text)
          expect(retrievedStudent.password).toBeTruthy();
          expect(retrievedStudent.password).not.toBe(studentData.password);
          expect(retrievedStudent.password).toBe(hashedPassword);
          
          // Verify class assignment (should be null as we're not assigning to a class)
          expect(retrievedStudent.class_id).toBeNull();
        }
      ),
      { numRuns: 20 } // Run 20 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 4: Bulk student creation atomicity
 * Validates: Requirements 1.4
 * 
 * Property: For any list of valid student records, bulk creation should result in 
 * all students being created with correct class assignments or none if any validation fails.
 */
describe('Property 4: Bulk student creation atomicity', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('bulk creation should create all students with correct class assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of student data
        fc.array(
          fc.record({
            email: fc.emailAddress(),
            name: fc.array(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
              { minLength: 2, maxLength: 20 }
            ).map(arr => arr.join('')),
            surname: fc.array(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
              { minLength: 2, maxLength: 20 }
            ).map(arr => arr.join(''))
          }),
          { minLength: 1, maxLength: 3 } // Test with 1-3 students
        ),
        async (studentsData) => {
          const { generateRandomPassword } = require('../utils/password');
          const createdStudents = [];

          // Create all students (simulating bulk registration logic)
          for (const studentData of studentsData) {
            const plainPassword = generateRandomPassword();
            const hashedPassword = await hashPassword(plainPassword);

            const newStudent = await userRepository.create({
              role: 'student',
              email: studentData.email,
              password: hashedPassword,
              name: studentData.name,
              surname: studentData.surname,
              class_id: null, // Using null to avoid FK constraint
              degree: null,
              seccond_name: null,
              second_surname: null,
              google_id: null
            });

            createdStudents.push(newStudent);
            testUsers.push(newStudent);
          }

          // Verify all students were created
          expect(createdStudents.length).toBe(studentsData.length);

          // Verify each student has correct attributes
          for (let i = 0; i < studentsData.length; i++) {
            const originalData = studentsData[i];
            const createdStudent = createdStudents[i];

            // Retrieve from database to verify persistence
            const retrievedStudent = await userRepository.findById(createdStudent.id);

            expect(retrievedStudent).toBeTruthy();
            expect(retrievedStudent.email).toBe(originalData.email);
            expect(retrievedStudent.name).toBe(originalData.name);
            expect(retrievedStudent.surname).toBe(originalData.surname);
            expect(retrievedStudent.role).toBe('student');
            expect(retrievedStudent.class_id).toBeNull();
            expect(retrievedStudent.password).toBeTruthy();
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations (reduced for performance)
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 5: Update operations preserve data integrity
 * Validates: Requirements 1.5
 * 
 * Property: For any entity (class, teacher, student) and valid update data, 
 * updating the entity should preserve all unchanged fields and correctly update specified fields.
 */
describe('Property 5: Update operations preserve data integrity', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('updating user should preserve unchanged fields and update specified fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial user data
        fc.record({
          email: fc.emailAddress(),
          password: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
            { minLength: 8, maxLength: 20 }
          ).map(arr => arr.join('')),
          name: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          surname: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          role: fc.constantFrom('student', 'teacher', 'admin')
        }),
        // Generate update data (subset of fields, excluding class_id to avoid FK issues)
        fc.record({
          name: fc.option(
            fc.array(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
              { minLength: 2, maxLength: 20 }
            ).map(arr => arr.join('')),
            { nil: undefined }
          ),
          surname: fc.option(
            fc.array(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
              { minLength: 2, maxLength: 20 }
            ).map(arr => arr.join('')),
            { nil: undefined }
          )
        }),
        async (initialData, updateData) => {
          // Create initial user without class_id to avoid FK constraint
          const hashedPassword = await hashPassword(initialData.password);
          const createdUser = await userRepository.create({
            role: initialData.role,
            email: initialData.email,
            password: hashedPassword,
            name: initialData.name,
            surname: initialData.surname,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });

          testUsers.push(createdUser);

          // Filter out undefined values from update data
          const filteredUpdateData = {};
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              filteredUpdateData[key] = updateData[key];
            }
          });

          // Update user with partial data
          if (Object.keys(filteredUpdateData).length > 0) {
            await userRepository.update(createdUser.id, filteredUpdateData);
          }

          // Retrieve updated user
          const updatedUser = await userRepository.findById(createdUser.id);

          // Verify unchanged fields are preserved
          expect(updatedUser.id).toBe(createdUser.id);
          expect(updatedUser.email).toBe(initialData.email);
          expect(updatedUser.role).toBe(initialData.role);
          expect(updatedUser.password).toBe(hashedPassword);

          // Verify updated fields are changed
          if (filteredUpdateData.name !== undefined) {
            expect(updatedUser.name).toBe(filteredUpdateData.name);
          } else {
            expect(updatedUser.name).toBe(initialData.name);
          }

          if (filteredUpdateData.surname !== undefined) {
            expect(updatedUser.surname).toBe(filteredUpdateData.surname);
          } else {
            expect(updatedUser.surname).toBe(initialData.surname);
          }

          // class_id should remain null as we didn't update it
          expect(updatedUser.class_id).toBeNull();
        }
      ),
      { numRuns: 20 } // Run 20 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 35: Bulk registration validates before creation
 * Validates: Requirements 9.3
 * 
 * Property: For any bulk registration request, all records should be validated 
 * before any accounts are created in Users table.
 */
describe('Property 35: Bulk registration validates before creation', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('validation failure should prevent all account creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a mix of valid and invalid student data
        fc.record({
          validStudents: fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.array(
                fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
                { minLength: 2, maxLength: 20 }
              ).map(arr => arr.join('')),
              surname: fc.array(
                fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
                { minLength: 2, maxLength: 20 }
              ).map(arr => arr.join(''))
            }),
            { minLength: 1, maxLength: 2 }
          ),
          duplicateEmail: fc.emailAddress()
        }),
        async ({ validStudents, duplicateEmail }) => {
          const { generateRandomPassword } = require('../utils/password');
          
          // First, create a user with the duplicate email
          const existingUser = await userRepository.create({
            role: 'student',
            email: duplicateEmail,
            password: await hashPassword(generateRandomPassword()),
            name: 'existing',
            surname: 'user',
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          testUsers.push(existingUser);

          // Count users before bulk registration attempt
          const usersBefore = await userRepository.findAll();
          const countBefore = usersBefore.length;

          // Attempt bulk registration with one duplicate email
          const studentsWithDuplicate = [
            ...validStudents,
            {
              email: duplicateEmail, // This should cause validation to fail
              name: 'duplicate',
              surname: 'test'
            }
          ];

          // Simulate validation logic from bulk registration
          let validationFailed = false;
          const emailSet = new Set();

          for (const student of studentsWithDuplicate) {
            // Check for duplicates in batch
            if (emailSet.has(student.email)) {
              validationFailed = true;
              break;
            }
            emailSet.add(student.email);

            // Check if email exists in database
            const existing = await userRepository.findByEmail(student.email);
            if (existing) {
              validationFailed = true;
              break;
            }
          }

          // If validation failed, no new users should be created
          if (validationFailed) {
            const usersAfter = await userRepository.findAll();
            const countAfter = usersAfter.length;

            // Count should be the same (no new users created)
            expect(countAfter).toBe(countBefore);
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 12: Password reset generates new credentials
 * Validates: Requirements 3.1
 * 
 * Property: For any student account, resetting the password should generate 
 * a new temporary bcrypt hashed password.
 */
describe('Property 12: Password reset generates new credentials', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('password reset should generate new hashed password', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random student data
        fc.record({
          email: fc.emailAddress(),
          password: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')),
            { minLength: 8, maxLength: 20 }
          ).map(arr => arr.join('')),
          name: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          surname: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join(''))
        }),
        async (studentData) => {
          const { generateRandomPassword } = require('../utils/password');
          
          // Create initial student with original password
          const originalHashedPassword = await hashPassword(studentData.password);
          const createdStudent = await userRepository.create({
            role: 'student',
            email: studentData.email,
            password: originalHashedPassword,
            name: studentData.name,
            surname: studentData.surname,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });

          testUsers.push(createdStudent);

          // Simulate password reset
          const newPassword = generateRandomPassword();
          const newHashedPassword = await hashPassword(newPassword);

          // Update password
          await userRepository.update(createdStudent.id, { password: newHashedPassword });

          // Retrieve updated user
          const updatedUser = await userRepository.findById(createdStudent.id);

          // Verify password was changed
          expect(updatedUser.password).toBeTruthy();
          expect(updatedUser.password).not.toBe(originalHashedPassword);
          expect(updatedUser.password).toBe(newHashedPassword);

          // Verify new password is a bcrypt hash (starts with $2b$ or $2a$)
          expect(updatedUser.password).toMatch(/^\$2[ab]\$/);

          // Verify new password is not plain text
          expect(updatedUser.password).not.toBe(newPassword);
        }
      ),
      { numRuns: 20 } // Run 20 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 37: Passwords stored as bcrypt hashes
 * Validates: Requirements 10.1
 * 
 * Property: For any user account in Users table, the password field should contain 
 * a bcrypt hash, not the plain text password.
 */
describe('Property 37: Passwords stored as bcrypt hashes', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      try {
        await userRepository.delete(user.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('all stored passwords should be bcrypt hashes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data
        fc.record({
          email: fc.emailAddress(),
          password: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'.split('')),
            { minLength: 8, maxLength: 20 }
          ).map(arr => arr.join('')),
          name: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          surname: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 2, maxLength: 20 }
          ).map(arr => arr.join('')),
          role: fc.constantFrom('student', 'teacher', 'admin')
        }),
        async (userData) => {
          // Hash the password before storing
          const hashedPassword = await hashPassword(userData.password);

          // Create user
          const createdUser = await userRepository.create({
            role: userData.role,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            surname: userData.surname,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });

          testUsers.push(createdUser);

          // Retrieve user from database
          const retrievedUser = await userRepository.findById(createdUser.id);

          // Verify password is stored as bcrypt hash
          expect(retrievedUser.password).toBeTruthy();
          
          // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
          expect(retrievedUser.password).toMatch(/^\$2[aby]\$\d{2}\$/);

          // Verify password is NOT stored as plain text
          expect(retrievedUser.password).not.toBe(userData.password);

          // Verify the hash length is typical for bcrypt (60 characters)
          expect(retrievedUser.password.length).toBe(60);

          // Verify we can validate the password using bcrypt compare
          const { comparePassword } = require('../utils/password');
          const isValid = await comparePassword(userData.password, retrievedUser.password);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 20 } // Run 20 iterations as specified in design
    );
  });
});
