const fc = require('fast-check');
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

/**
 * Feature: povinná-četba-app, Property 30: API responses in JSON format
 * Validates: Requirements 8.2
 * 
 * Property: For any API endpoint response, the content type should be application/json 
 * and the body should be valid JSON.
 */
describe('Property 30: API responses in JSON format', () => {
  let authToken;

  beforeAll(() => {
    // Create a valid JWT token for authenticated requests
    authToken = jwt.sign(
      { id: 1, role: 'admin', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  test('all API endpoints should return JSON responses', async () => {
    // Test various endpoints
    const endpoints = [
      { method: 'get', path: '/api/users', authenticated: true },
      { method: 'get', path: '/api/classes', authenticated: true },
      { method: 'get', path: '/api/books', authenticated: true },
      { method: 'get', path: '/api/authors', authenticated: true },
      { method: 'get', path: '/api/literary-classes', authenticated: true },
      { method: 'get', path: '/api/periods', authenticated: true },
      { method: 'get', path: '/api/reading-lists/my', authenticated: true },
      { method: 'post', path: '/api/auth/login', authenticated: false }
    ];

    for (const endpoint of endpoints) {
      let req = request(app)[endpoint.method](endpoint.path);
      
      if (endpoint.authenticated) {
        req = req.set('Authorization', `Bearer ${authToken}`);
      }

      // For POST requests, send some data
      if (endpoint.method === 'post') {
        req = req.send({ email: 'test@example.com', password: 'password123' });
      }

      const response = await req;

      // Verify Content-Type header includes application/json
      expect(response.headers['content-type']).toMatch(/application\/json/);

      // Verify response body is valid JSON (supertest automatically parses it)
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    }
  });

  test('error responses should also be in JSON format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 999999 }),
        async (invalidId) => {
          const response = await request(app)
            .get(`/api/users/${invalidId}`)
            .set('Authorization', `Bearer ${authToken}`);

          // Even error responses should be JSON
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body).toBeDefined();
          expect(typeof response.body).toBe('object');
          expect(response.body.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 31: API returns appropriate HTTP status codes
 * Validates: Requirements 8.3
 * 
 * Property: For any API request, the response should include an HTTP status code that 
 * correctly represents the outcome (2xx for success, 4xx for client errors, 5xx for server errors).
 */
describe('Property 31: API returns appropriate HTTP status codes', () => {
  let authToken;

  beforeAll(() => {
    authToken = jwt.sign(
      { id: 1, role: 'admin', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  test('successful requests should return 2xx status codes', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    // Successful requests should return 2xx
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  test('unauthorized requests should return 401', async () => {
    const response = await request(app)
      .get('/api/users');

    // Missing authentication should return 401
    expect(response.status).toBe(401);
  });

  test('invalid authentication should return 401', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer invalid-token');

    // Invalid token should return 401
    expect(response.status).toBe(401);
  });

  test('not found resources should return 404', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }),
        async (nonExistentId) => {
          const response = await request(app)
            .get(`/api/users/${nonExistentId}`)
            .set('Authorization', `Bearer ${authToken}`);

          // Non-existent resources should return 404
          expect(response.status).toBe(404);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('validation errors should return 400', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing required fields
        email: 'invalid-email'
      });

    // Validation errors should return 400
    expect(response.status).toBe(400);
  });

  test('forbidden access should return 403', async () => {
    // Create a student token
    const studentToken = jwt.sign(
      { id: 2, role: 'student', email: 'student@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        role: 'student',
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        password: 'password123'
      });

    // Students trying to create users should get 403
    expect(response.status).toBe(403);
  });
});

/**
 * Feature: povinná-četba-app, Property 32: API validates input data
 * Validates: Requirements 8.5
 * 
 * Property: For any API request with invalid input data, the system should reject 
 * the request and return validation errors.
 */
describe('Property 32: API validates input data', () => {
  let authToken;

  beforeAll(() => {
    authToken = jwt.sign(
      { id: 1, role: 'admin', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  test('invalid email format should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
        async (invalidEmail) => {
          const response = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              role: 'student',
              name: 'Test',
              surname: 'User',
              email: invalidEmail,
              password: 'password123'
            });

          // Invalid email should be rejected with 400
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('missing required fields should be rejected', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing name, surname, email
        role: 'student'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test('invalid role should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(s => !['student', 'teacher', 'admin'].includes(s)),
        async (invalidRole) => {
          const response = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              role: invalidRole,
              name: 'Test',
              surname: 'User',
              email: 'test@example.com',
              password: 'password123'
            });

          // Invalid role should be rejected
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('short password should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 7 }),
        async (shortPassword) => {
          const response = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              role: 'student',
              name: 'Test',
              surname: 'User',
              email: 'test@example.com',
              password: shortPassword
            });

          // Short password should be rejected
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Feature: povinná-četba-app, Property 39: API endpoints require authentication token
 * Validates: Requirements 10.4
 * 
 * Property: For any API endpoint (except login and OAuth callbacks), requests without 
 * a valid JWT authentication token should be rejected.
 */
describe('Property 39: API endpoints require authentication token', () => {
  test('protected endpoints should reject requests without token', async () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/users' },
      { method: 'get', path: '/api/classes' },
      { method: 'get', path: '/api/books' },
      { method: 'get', path: '/api/authors' },
      { method: 'get', path: '/api/literary-classes' },
      { method: 'get', path: '/api/periods' },
      { method: 'get', path: '/api/reading-lists/my' },
      { method: 'post', path: '/api/users' },
      { method: 'post', path: '/api/classes' },
      { method: 'post', path: '/api/books' }
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request(app)[endpoint.method](endpoint.path);

      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }
  });

  test('protected endpoints should reject requests with invalid token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        async (invalidToken) => {
          const response = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${invalidToken}`);

          // Invalid token should return 401
          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  test('login endpoint should not require authentication', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // Login should not return 401 for missing token (it may return 401 for invalid credentials, 
    // but the error message should be about credentials, not token)
    if (response.status === 401) {
      // If it's 401, it should be about invalid credentials, not missing token
      expect(response.body.error.message).not.toMatch(/token|authentication required/i);
    } else {
      // Otherwise, any other status is fine (400 for validation, etc.)
      expect(response.status).toBeDefined();
    }
  });

  test('protected endpoints should accept valid token', async () => {
    const validToken = jwt.sign(
      { id: 1, role: 'admin', email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${validToken}`);

    // Valid token should not return 401
    expect(response.status).not.toBe(401);
  });
});
