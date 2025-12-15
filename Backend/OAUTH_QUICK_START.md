# Google OAuth Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

### 2. Configure Environment

Edit `Backend/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 3. Create Test User

Run this SQL in your database:

```sql
INSERT INTO Users (role, name, surname, email, class_id)
VALUES ('student', 'Test', 'User', 'your-gmail@gmail.com', 1);
```

Replace `your-gmail@gmail.com` with your actual Gmail address.

### 4. Start Servers

```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend
cd Frontend
node server.js
```

### 5. Test OAuth

1. Open http://localhost:8080/pages/login.html
2. Click "Přihlásit se přes Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard

## ✅ Verification

If everything works:
- ✅ Google sign-in page appears
- ✅ After signing in, you're redirected back
- ✅ You see the dashboard
- ✅ Your name appears in the UI

## ❌ Troubleshooting

### "No account found with this email"
→ Create user in database with matching email

### "Redirect URI mismatch"
→ Check callback URL in `.env` matches Google Console

### "Invalid client"
→ Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### Button doesn't work
→ Check browser console for errors

## 📚 Full Documentation

See `GOOGLE_OAUTH_SETUP.md` for complete setup guide.

## 🔒 Security Notes

- Users must be pre-registered by admin
- OAuth links to existing accounts via email
- No password needed for OAuth users
- Use HTTPS in production
