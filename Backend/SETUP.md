# Setup Instructions

## Prerequisites Installation

### 1. Install Node.js

Download and install Node.js from: https://nodejs.org/

Recommended version: LTS (Long Term Support)

After installation, verify by running:
```bash
node --version
npm --version
```

### 2. Install Dependencies

Once Node.js is installed, navigate to the Backend directory and run:
```bash
cd Backend
npm install
```

This will install all required dependencies:
- express (web framework)
- mysql2 (MariaDB driver)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- express-validator (input validation)
- cors (CORS middleware)
- dotenv (environment variables)

### 3. Configure Database

1. Make sure MariaDB is running
2. Create the database using the SQL file:
   ```bash
   mysql -u root -p < ../Frontend/testTest-2.sql
   ```
3. Update the `.env` file with your database credentials:
   - DB_HOST (default: localhost)
   - DB_PORT (default: 3306)
   - DB_USER (default: root)
   - DB_PASSWORD (your password)
   - DB_NAME (default: MaturitniCetba)

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on http://localhost:3000

### 5. Test the API

Open your browser or use curl:
```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "API is running"
}
```

## Troubleshooting

### Database Connection Issues

If you see "Database connection failed":
1. Check that MariaDB is running
2. Verify credentials in `.env` file
3. Ensure the database `MaturitniCetba` exists
4. Check that the user has proper permissions

### Port Already in Use

If port 3000 is already in use, change the PORT in `.env` file:
```
PORT=3001
```

## Next Steps

After successful setup, you can proceed with implementing:
- Authentication endpoints
- User management
- Class management
- Book management
- Reading list functionality
