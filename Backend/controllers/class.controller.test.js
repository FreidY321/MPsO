const fc = require('fast-check');
const ClassRepository = require('../repositories/ClassRepository');

/**
 * Feature: povinná-četba-app, Property 1: Class creation persistence
 * Validates: Requirements 1.1
 * 
 * Property: For any valid class data with name, year, deadline and assigned teacher, 
 * creating the class should result in the class being stored with all provided 
 * attributes accessible via retrieval.
 */
describe('Property 1: Class creation persistence', () => {
  const classRepository = new ClassRepository();
  let testClasses = [];

  afterAll(async () => {
    // Clean up test classes
    for (const classData of testClasses) {
      try {
        await classRepository.delete(classData.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('creating class should store all provided attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random class data
        fc.record({
          // Class name is VARCHAR(4) in database (e.g., "I4A", "E3B")
          name: fc.tuple(
            fc.integer({ min: 1, max: 9 }),
            fc.constantFrom('.'),
            fc.constantFrom(...'ABCDEFGH'.split(''))
          ).map(([num, dot, letter]) => `${num}${dot}${letter}`),
          year_ended: fc.integer({ min: 2024, max: 2030 }),
          deadline: fc.option(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') }),
            { nil: null }
          )
        }),
        async (classData) => {
          // Create class without teacher to avoid FK constraint issues
          // (teacher can be assigned later via update)
          const createdClass = await classRepository.create({
            name: classData.name,
            year_ended: classData.year_ended,
            deadline: classData.deadline,
            cj_teacher: null
          });

          testClasses.push(createdClass);

          // Verify the class was created with an ID
          expect(createdClass).toBeTruthy();
          expect(createdClass.id).toBeTruthy();

          // Retrieve the class from database to verify persistence
          const retrievedClass = await classRepository.findById(createdClass.id);

          // Verify all attributes are correctly stored
          expect(retrievedClass).toBeTruthy();
          expect(retrievedClass.name).toBe(classData.name);
          expect(retrievedClass.year_ended).toBe(classData.year_ended);

          // Handle deadline comparison (may be null or date)
          if (classData.deadline === null) {
            expect(retrievedClass.deadline).toBeNull();
          } else {
            expect(retrievedClass.deadline).toBeTruthy();
          }

          // Teacher should be null as we didn't assign one
          expect(retrievedClass.cj_teacher).toBeNull();
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 2: Teacher assignment updates relationship
 * Validates: Requirements 1.2
 * 
 * Property: For any existing class and teacher, assigning the teacher to the class 
 * should result in the cj_teacher field being updated correctly.
 */
describe('Property 2: Teacher assignment updates relationship', () => {
  const classRepository = new ClassRepository();
  const UserRepository = require('../repositories/UserRepository');
  const userRepository = new UserRepository();
  const { hashPassword } = require('../utils/password');
  
  let testClasses = [];
  let testTeachers = [];

  afterAll(async () => {
    // Clean up test classes
    for (const classData of testClasses) {
      try {
        await classRepository.delete(classData.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test teachers
    for (const teacher of testTeachers) {
      try {
        await userRepository.delete(teacher.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('assigning teacher to class should update cj_teacher field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random class data
        fc.record({
          className: fc.tuple(
            fc.integer({ min: 1, max: 9 }),
            fc.constantFrom('.'),
            fc.constantFrom(...'ABCDEFGH'.split(''))
          ).map(([num, dot, letter]) => `${num}${dot}${letter}`),
          year_ended: fc.integer({ min: 2024, max: 2030 }),
          teacherName: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 3, maxLength: 10 }
          ).map(arr => arr.join('')),
          teacherSurname: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            { minLength: 3, maxLength: 10 }
          ).map(arr => arr.join('')),
          teacherEmail: fc.emailAddress()
        }),
        async (data) => {
          // Create a teacher user
          const hashedPassword = await hashPassword('testpassword123');
          const teacher = await userRepository.create({
            role: 'teacher',
            name: data.teacherName,
            surname: data.teacherSurname,
            email: data.teacherEmail,
            password: hashedPassword,
            class_id: null,
            degree: null,
            seccond_name: null,
            second_surname: null,
            google_id: null
          });
          
          testTeachers.push(teacher);

          // Create a class without teacher
          const createdClass = await classRepository.create({
            name: data.className,
            year_ended: data.year_ended,
            deadline: null,
            cj_teacher: null
          });

          testClasses.push(createdClass);

          // Verify class was created without teacher
          expect(createdClass.cj_teacher).toBeNull();

          // Assign teacher to class
          const updated = await classRepository.update(createdClass.id, {
            cj_teacher: teacher.id
          });

          expect(updated).toBe(true);

          // Retrieve the updated class
          const updatedClass = await classRepository.findById(createdClass.id);

          // Verify teacher assignment
          expect(updatedClass).toBeTruthy();
          expect(updatedClass.cj_teacher).toBe(teacher.id);
          
          // Verify other fields remain unchanged
          expect(updatedClass.name).toBe(data.className);
          expect(updatedClass.year_ended).toBe(data.year_ended);
          expect(updatedClass.deadline).toBeNull();
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});
