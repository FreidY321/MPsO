const fc = require('fast-check');
const LiteraryClassRepository = require('../repositories/LiteraryClassRepository');

/**
 * Feature: povinná-četba-app, Property 6: Literary class creation with constraints
 * Validates: Requirements 2.1
 * 
 * Property: For any valid literary class data with name, min_request and max_request, 
 * creating the literary class should store all attributes correctly.
 */
describe('Property 6: Literary class creation with constraints', () => {
  const literaryClassRepository = new LiteraryClassRepository();
  let testLiteraryClasses = [];

  afterAll(async () => {
    // Clean up test literary classes
    for (const literaryClass of testLiteraryClasses) {
      try {
        await literaryClassRepository.delete(literaryClass.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('creating literary class should store all attributes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random literary class data
        fc.record({
          name: fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('')),
            { minLength: 5, maxLength: 50 }
          ).map(arr => arr.join('').trim()),
          min_request: fc.integer({ min: 0, max: 20 }),
          max_request: fc.integer({ min: 0, max: 30 })
        }).filter(data => {
          // Ensure max_request >= min_request
          return data.max_request >= data.min_request && data.name.length > 0;
        }),
        async (literaryClassData) => {
          // Create literary class
          const createdLiteraryClass = await literaryClassRepository.create({
            name: literaryClassData.name,
            min_request: literaryClassData.min_request,
            max_request: literaryClassData.max_request
          });

          testLiteraryClasses.push(createdLiteraryClass);

          // Verify the literary class was created with an ID
          expect(createdLiteraryClass).toBeTruthy();
          expect(createdLiteraryClass.id).toBeTruthy();

          // Retrieve the literary class from database to verify persistence
          const retrievedLiteraryClass = await literaryClassRepository.findById(createdLiteraryClass.id);

          // Verify all attributes are correctly stored
          expect(retrievedLiteraryClass).toBeTruthy();
          expect(retrievedLiteraryClass.name).toBe(literaryClassData.name);
          expect(retrievedLiteraryClass.min_request).toBe(literaryClassData.min_request);
          expect(retrievedLiteraryClass.max_request).toBe(literaryClassData.max_request);

          // Verify constraint: max_request >= min_request
          expect(retrievedLiteraryClass.max_request).toBeGreaterThanOrEqual(retrievedLiteraryClass.min_request);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});
