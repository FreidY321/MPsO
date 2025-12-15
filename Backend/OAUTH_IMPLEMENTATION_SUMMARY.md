# Google OAuth Implementation Summary

## Overview

Google OAuth 2.0 authentication has been successfully implemented for the Povinná četba application. This allows users to sign in using their Google accounts instead of traditional email/password authentication.

## What Was Implemented

### 1. Backend Components

#### Dependencies Installed
- `passport` - Authentication middleware for Node.js
- `passport-google-oauth20` - Google OAuth 2.0 strategy for Passport
- `express-session` - Session middleware (required by Passport)

#### New Files Created

**`Backend/config/passport.js`**
- Configures Passport with Google OAuth 2.0 strategy
- Handles user lookup and creation/update logic
- Implements serialization/deserialization for sessions

**`Backend/GOOGLE_OAUTH_SETUP.md`**
- Complete setup guide for Google Cloud Console
- Configuration instructions
- Troubleshooting tips

#### Modified Files

**`Backend/controllers/auth.controller.js`**
- Added `googleAuth` function - initiates OAuth flow
- Added `googleAuthCallback` function - handles OAuth callback
- Generates JWT token after successful OAuth authentication

**`Backend/routes/auth.routes.js`**
- Added `GET /api/auth/google` endpoint
- Added `GET /api/auth/google/callback` endpoint

**`Backend/server.js`**
- Imported passport configuration
- Initialized passport middleware

**`Backend/.env` and `Backend/.env.example`**
- Added Google OAuth configuration variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`

**`Backend/API_DOCUMENTATION.md`**
- Added documentation for OAuth endpoints

**`Backend/swagger-docs.js`**
- Added Swagger documentation for OAuth endpoints

### 2. Frontend Components

#### Modified Files

**`Frontend/pages/login.html`**
- Enabled Google OAuth button (removed `disabled` attribute)
- Changed button text from "Přihlásit se přes Google (brzy)" to "Přihlásit se přes Google"

**`Frontend/public/js/auth.js`**
- Implemented `handleGoogleLogin()` - redirects to OAuth endpoint
- Added `checkOAuthCallback()` - checks URL for token/error from OAuth
- Added `fetchUserData()` - fetches user data after OAuth login
- Updated initialization to check for OAuth callback first

## How It Works

### Authentication Flow

1. **User Initiates OAuth**
   - User clicks "Přihlásit se přes Google" button
   - Frontend redirects to `GET /api/auth/google`

2. **Backend Initiates OAuth Flow**
   - Passport redirects to Google OAuth consent screen
   - User sees Google sign-in page

3. **User Grants Permission**
   - User selects Google account
   - User grants permission to access profile and email

4. **Google Redirects to Callback**
   - Google redirects to `GET /api/auth/google/callback` with authorization code
   - Backend exchanges code for user profile

5. **Backend Processes Authentication**
   - Checks if user exists with `google_id`
   - If not, checks if user exists with matching email
   - If user exists, updates with `google_id` (if needed)
   - If user doesn't exist, returns error (users must be pre-registered)

6. **Backend Generates Token**
   - Creates JWT token with user information
   - Redirects to frontend with token in URL

7. **Frontend Handles Token**
   - Extracts token from URL
   - Fetches full user data using token
   - Stores token and user data in localStorage
   - Redirects to appropriate dashboard

### Security Considerations

- **Pre-registration Required**: Users must be registered by admin before using OAuth
- **Email Matching**: OAuth accounts are linked to existing users via email
- **JWT Tokens**: Stateless authentication using JWT
- **No Password Storage**: OAuth users don't need passwords in database
- **HTTPS Required**: Production deployment should use HTTPS

## Configuration Required

Before using Google OAuth, you must:

1. **Create Google Cloud Project**
   - Go to Google Cloud Console
   - Create new project

2. **Enable Google+ API**
   - Enable in APIs & Services

3. **Create OAuth Credentials**
   - Create OAuth 2.0 Client ID
   - Configure authorized redirect URIs

4. **Update Environment Variables**
   - Set `GOOGLE_CLIENT_ID`
   - Set `GOOGLE_CLIENT_SECRET`
   - Set `GOOGLE_CALLBACK_URL`

See `Backend/GOOGLE_OAUTH_SETUP.md` for detailed instructions.

## Testing

### Prerequisites
- Google OAuth credentials configured
- Test user in database with matching email

### Test Steps
1. Start backend server: `npm start`
2. Start frontend server
3. Navigate to login page
4. Click "Přihlásit se přes Google"
5. Sign in with Google account
6. Verify redirect to dashboard

### Test User Setup
```sql
INSERT INTO Users (role, name, surname, email, class_id)
VALUES ('student', 'Test', 'User', 'testuser@gmail.com', 1);
```

## API Endpoints

### GET /api/auth/google
- **Purpose**: Initiate Google OAuth flow
- **Access**: Public
- **Response**: Redirect to Google OAuth consent screen

### GET /api/auth/google/callback
- **Purpose**: Handle OAuth callback from Google
- **Access**: Public (called by Google)
- **Success**: Redirects to `{CORS_ORIGIN}/pages/login.html?token={jwt}`
- **Error**: Redirects to `{CORS_ORIGIN}/pages/login.html?error={message}`

## Error Handling

### Common Errors

1. **"No account found with this email"**
   - User not registered in database
   - Solution: Admin must create user first

2. **"Redirect URI mismatch"**
   - Callback URL doesn't match Google Console configuration
   - Solution: Update authorized redirect URIs

3. **"This account uses Google sign-in"**
   - User trying to login with password but only has OAuth
   - Solution: Use Google OAuth button

## Future Enhancements

Possible improvements:
- Allow OAuth-only accounts (no email/password)
- Support multiple OAuth providers (Microsoft, Facebook)
- Add OAuth account linking UI
- Implement OAuth token refresh

## Requirements Validated

This implementation satisfies:
- **Requirement 4.1**: Google OAuth authentication
- **Requirement 4.3**: JWT token generation after OAuth

## Files Changed Summary

### Backend
- ✅ `package.json` - Added dependencies
- ✅ `config/passport.js` - New file
- ✅ `controllers/auth.controller.js` - Added OAuth functions
- ✅ `routes/auth.routes.js` - Added OAuth routes
- ✅ `server.js` - Initialize passport
- ✅ `.env` - Added OAuth config
- ✅ `.env.example` - Added OAuth config template
- ✅ `API_DOCUMENTATION.md` - Added OAuth docs
- ✅ `swagger-docs.js` - Added OAuth Swagger docs
- ✅ `GOOGLE_OAUTH_SETUP.md` - New setup guide

### Frontend
- ✅ `pages/login.html` - Enabled Google button
- ✅ `public/js/auth.js` - Added OAuth handling

## Deployment Checklist

Before deploying to production:

- [ ] Create production Google Cloud project
- [ ] Configure OAuth consent screen
- [ ] Add production redirect URI to Google Console
- [ ] Update `.env` with production credentials
- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Enable HTTPS on production server
- [ ] Test OAuth flow in production
- [ ] Monitor OAuth errors in logs

## Support

For issues or questions:
1. Check `GOOGLE_OAUTH_SETUP.md` for setup instructions
2. Review error messages in browser console
3. Check backend logs for detailed errors
4. Verify Google Cloud Console configuration
