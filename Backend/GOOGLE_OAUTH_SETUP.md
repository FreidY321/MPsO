# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for the Povinná četba application.

## Prerequisites

- Google Cloud Platform account
- Access to Google Cloud Console

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: Internal (for school use) or External
   - App name: Povinná četba
   - User support email: Your email
   - Developer contact: Your email
4. Select "Web application" as the application type
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### 4. Configure Environment Variables

Update your `.env` file with the credentials:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

For production, update `GOOGLE_CALLBACK_URL` to your production domain.

### 5. Configure OAuth Consent Screen (if External)

1. Go to "APIs & Services" > "OAuth consent screen"
2. Fill in required information:
   - App name: Povinná četba
   - User support email
   - App logo (optional)
   - App domain (optional)
   - Authorized domains: Add your domain
3. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
4. Add test users (if in testing mode)
5. Save and continue

## How It Works

### User Flow

1. User clicks "Přihlásit se přes Google" button on login page
2. User is redirected to Google OAuth consent screen
3. User grants permission to the application
4. Google redirects back to `/api/auth/google/callback` with authorization code
5. Backend exchanges code for user profile information
6. Backend checks if user exists in database:
   - If user exists with `google_id`: Login successful
   - If user exists with matching email but no `google_id`: Update user with `google_id` and login
   - If user doesn't exist: Show error (users must be pre-registered by admin)
7. Backend generates JWT token and redirects to frontend with token
8. Frontend stores token and redirects to appropriate dashboard

### Security Notes

- Users must be pre-registered by admin before they can use Google OAuth
- The system links Google accounts to existing user accounts via email
- JWT tokens are used for session management (stateless)
- OAuth is only used for authentication, not authorization

## Testing

### Local Testing

1. Ensure your `.env` file has correct Google OAuth credentials
2. Start the backend server: `npm start`
3. Start the frontend server
4. Navigate to login page
5. Click "Přihlásit se přes Google"
6. Sign in with a Google account that matches an email in the database

### Test User Setup

Before testing OAuth, ensure you have a test user in the database:

```sql
INSERT INTO Users (role, name, surname, email, class_id)
VALUES ('student', 'Test', 'User', 'testuser@gmail.com', 1);
```

The user doesn't need a password for OAuth login.

## Troubleshooting

### "No account found with this email"

- Ensure the Google account email matches a user email in the database
- Check that the user was created by admin

### "Redirect URI mismatch"

- Verify the callback URL in `.env` matches the authorized redirect URI in Google Cloud Console
- Check for trailing slashes or http vs https

### "Access blocked: This app's request is invalid"

- Ensure Google+ API is enabled
- Check OAuth consent screen configuration
- Verify authorized domains are set correctly

### "Failed to generate authentication token"

- Check JWT_SECRET is set in `.env`
- Verify the user data is complete in database

## Production Deployment

1. Update `GOOGLE_CALLBACK_URL` in `.env` to production URL
2. Add production callback URL to Google Cloud Console authorized redirect URIs
3. Update `CORS_ORIGIN` in `.env` to production frontend URL
4. If using External OAuth consent screen, submit for verification (if needed)
5. Ensure HTTPS is enabled on production server

## API Endpoints

### GET /api/auth/google
Initiates Google OAuth flow. Redirects to Google consent screen.

### GET /api/auth/google/callback
Handles OAuth callback from Google. Processes authentication and redirects to frontend.

**Success redirect:** `{CORS_ORIGIN}/pages/login.html?token={jwt_token}`

**Error redirect:** `{CORS_ORIGIN}/pages/login.html?error={error_message}`

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
