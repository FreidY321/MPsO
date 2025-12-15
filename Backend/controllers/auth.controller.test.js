const fc = require('fast-check');
const UserRepository = require('../repositories/UserRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, verifyToken } = require('../utils/jwt');

/**
 * Feature: povinná-četba-app, Property 14: Valid authentication creates session
 * Validates: Requirements 4.1, 4.3
 * 
 * Property: For any valid email and password combination, successful authentication 
 * should create a valid JWT session token.
 */
describe('Property 14: Valid authentication creates session', () => {
  const userRepository = new UserRepository();
  let testUsers = [];

  beforeAll(async () => {
    // Set up JWT_SECRET for testing
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-for-authentication';
    }
  });

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

  test('valid credentials should create valid JWT token', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data with alphanumeric passwords to avoid bcrypt issues
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
        async (userData) => {
          // Create a test user with hashed password
          const hashedPassword = await hashPassword(userData.password);
          
          const createdUser = await userRepository.create({
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            surname: userData.surname,
            role: userData.role,
            degree: null,
            seccond_name: null,
            second_surname: null,
            class_id: null,
            google_id: null
          });

          testUsers.push(createdUser);

          // Simulate authentication process
          // 1. Find user by email
          const foundUser = await userRepository.findByEmail(userData.email);
          expect(foundUser).toBeTruthy();
          expect(foundUser.id).toBe(createdUser.id);

          // 2. Verify password
          const isPasswordValid = await comparePassword(userData.password, foundUser.password);
          expect(isPasswordValid).toBe(true);

          // 3. Generate JWT token
          const tokenPayload = {
            id: foundUser.id,
            email: foundUser.email,
            role: foundUser.role,
            classId: foundUser.class_id
          };
          const token = generateToken(tokenPayload);

          // Verify token is created
          expect(token).toBeTruthy();
          expect(typeof token).toBe('string');

          // Verify token is valid and contains correct user data
          const decoded = verifyToken(token);
          expect(decoded.id).toBe(createdUser.id);
          expect(decoded.email).toBe(userData.email);
          expect(decoded.role).toBe(userData.role);
        }
      ),
      { numRuns: 10 } // Run 10 iterations as specified in design
    );
  });
});
