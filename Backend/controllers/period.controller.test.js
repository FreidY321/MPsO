const fc = require('fast-check');
const PeriodRepository = require('../repositories/PeriodRepository');

/**
 * Feature: povinná-četba-app, Property 7: Period creation with constraints
 * Validates: Requirements 2.1
 * 
 * Property: For any valid period data with name, min_request and max_request, 
 * creating the period should store all attributes correctly.
 */
describe('Property 7: Period creation with constraints', () => {
  const periodRepository = new PeriodRepository();
  let testPeriods = [];

  afterAll(async () => {
    // Clean up test periods
    for (const period of testPeriods) {
      try {
        await periodRepository.delete(period.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('creating period should store all attributes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random period data
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
        async (periodData) => {
          // Create period
          const createdPeriod = await periodRepository.create({
            name: periodData.name,
            min_request: periodData.min_request,
            max_request: periodData.max_request
          });

          testPeriods.push(createdPeriod);

          // Verify the period was created with an ID
          expect(createdPeriod).toBeTruthy();
          expect(createdPeriod.id).toBeTruthy();

          // Retrieve the period from database to verify persistence
          const retrievedPeriod = await periodRepository.findById(createdPeriod.id);

          // Verify all attributes are correctly stored
          expect(retrievedPeriod).toBeTruthy();
          expect(retrievedPeriod.name).toBe(periodData.name);
          expect(retrievedPeriod.min_request).toBe(periodData.min_request);
          expect(retrievedPeriod.max_request).toBe(periodData.max_request);

          // Verify constraint: max_request >= min_request
          expect(retrievedPeriod.max_request).toBeGreaterThanOrEqual(retrievedPeriod.min_request);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});
