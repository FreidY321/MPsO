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

### 3. Configure Database

1. Make sure MariaDB is running
2. Create the database using the SQL file:
   ```bash
   mysql -u root -p < ../Backend/testTest-2.sql
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
