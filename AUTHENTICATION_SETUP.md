# Google OAuth Authentication Setup Guide

## 🚀 Quick Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Gmail API
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen:
   - User Type: External
   - App name: Internly
   - User support email: your-email@gmail.com
   - Developer contact information: your-email@gmail.com
7. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Internly Web Client
   - Authorized redirect URIs: 
     - `http://localhost:3001/api/auth/google/callback`
     - `http://localhost:3001/oauth2callback` (for existing Gmail integration)

### 2. Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Server Configuration
PORT=3001
NODE_ENV=development

# Google OAuth 2.0 Credentials (for authentication)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session Secret (change this in production)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 3. Start the Application

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### 4. Test the Authentication

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected to the dashboard
5. Your user info should appear in the top navigation

## 🔧 Features Added

### Backend
- ✅ Google OAuth 2.0 authentication
- ✅ User model with MongoDB storage
- ✅ Session-based authentication
- ✅ Protected routes for jobs
- ✅ User-specific job data

### Frontend
- ✅ Login page with Google OAuth
- ✅ Protected routes
- ✅ User context and state management
- ✅ Logout functionality
- ✅ User info display in navigation

## 🔒 Security Features

- **Session-based authentication** with secure cookies
- **User-specific data** - each user only sees their own jobs
- **Protected routes** - unauthenticated users are redirected to login
- **CORS configuration** with credentials support
- **Environment variables** for sensitive data

## 🚨 Important Notes

1. **Same Google OAuth credentials** can be used for both authentication and Gmail integration
2. **Session secret** should be changed in production
3. **HTTPS required** in production for secure cookies
4. **Database migration** - existing jobs will need to be associated with users

## 🔄 Database Migration

If you have existing jobs in your database, you'll need to migrate them to include user IDs. You can do this by:

1. Creating a migration script
2. Or manually updating the database
3. Or starting fresh with the new authentication system

## 🎯 Next Steps

1. Test the authentication flow
2. Verify that jobs are user-specific
3. Test the Gmail integration with authentication
4. Deploy to production with proper environment variables 