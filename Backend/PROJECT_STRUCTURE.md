# Project Structure

This document describes the complete backend project structure created for the Povinná četba application.

## Directory Structure

```
Backend/
│
├── config/
│   └── database.js              # MariaDB connection pool configuration
│
├── controllers/                 # Request handlers (to be implemented)
│   └── .gitkeep
│
├── middleware/
│   ├── errorHandler.js          # Centralized error handling
│   └── notFound.js              # 404 handler
│
├── repositories/                # Database access layer (to be implemented)
│   └── .gitkeep
│
├── routes/
│   └── index.js                 # Main router with health check endpoint
│
├── utils/
│   ├── AppError.js              # Custom error class
│   └── asyncHandler.js          # Async error wrapper
│
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── README.md                    # Project documentation
├── SETUP.md                     # Setup instructions
├── server.js                    # Application entry point
└── PROJECT_STRUCTURE.md         # This file
```

## Key Files

### server.js
Main application entry point that:
- Initializes Express app
- Configures middleware (CORS, JSON parsing)
- Mounts API routes
- Tests database connection on startup
- Starts HTTP server

### config/database.js
Database configuration that:
- Creates MySQL connection pool
- Configures connection parameters from .env
- Provides testConnection() function
- Uses utf16 charset for Czech language support

### middleware/errorHandler.js
Centralized error handling that:
- Catches all errors
- Returns consistent JSON error responses
- Includes stack traces in development mode
- Handles specific error types (validation, JWT, etc.)

### routes/index.js
Main router that:
- Will mount all sub-routes (auth, users, classes, etc.)
- Provides /api/health endpoint for monitoring

### utils/asyncHandler.js
Wrapper function that:
- Eliminates try-catch blocks in controllers
- Automatically passes errors to error handler

### utils/AppError.js
Custom error class that:
- Extends built-in Error
- Adds statusCode property
- Marks operational errors

## Environment Variables

Required variables in .env:
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET, JWT_EXPIRES_IN
- PORT, NODE_ENV
- CORS_ORIGIN

## Dependencies

### Production
- express: Web framework
- mysql2: MariaDB/MySQL driver with promise support
- bcrypt: Password hashing
- jsonwebtoken: JWT token generation/verification
- express-validator: Input validation
- cors: CORS middleware
- dotenv: Environment variable management

### Development
- nodemon: Auto-restart on file changes

## NPM Scripts

- `npm start`: Start server in production mode
- `npm run dev`: Start server with nodemon (auto-reload)
- `npm test`: Run tests (to be implemented)

## Next Implementation Steps

1. Implement repositories (Task 2)
2. Implement authentication module (Task 3)
3. Implement user management (Task 4)
4. Implement class management (Task 5)
5. Continue with remaining modules...

## Database Schema

The application connects to MariaDB database `MaturitniCetba` with tables:
- Users (students, teachers, admins)
- Classes (school classes)
- Authors (book authors)
- Books (reading list books)
- Literary_classes (literary genres)
- Periods (literary periods)
- student_book (many-to-many relationship)

See `../Frontend/testTest-2.sql` for complete schema.
