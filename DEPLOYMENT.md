# Deployment Guide for Internly

## 🚀 Quick Deploy Options

### Option 1: Vercel + Railway (Recommended)

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- **Database**: MongoDB Atlas

### Option 2: Heroku

- **Full-stack**: Deploy both frontend and backend to Heroku
- **Database**: MongoDB Atlas

### Option 3: DigitalOcean App Platform

- **Full-stack**: Deploy both services
- **Database**: Managed MongoDB

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Create production environment files:

**Backend (.env)**

DO NOT commit real secrets or credential-shaped connection strings to the repo. Set these as environment variables in your hosting platform.

```env
NODE_ENV=production
MONGO_URI=YOUR_MONGO_URI # e.g., mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
SESSION_SECRET=your-32-character-session-secret
JWT_SECRET=your-32-character-jwt-secret
EMAIL_USER=your-email@provider.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

**Frontend (.env.production)**

```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
```

### 2. Google Cloud Console Setup

1. Create production OAuth 2.0 credentials
2. Add production redirect URIs:
   - `https://your-domain.com/api/auth/google/callback`
   - `https://your-api-domain.com/api/auth/google/callback`
3. Update OAuth consent screen for production

### 3. MongoDB Atlas Setup

1. Create production cluster
2. Set up database user with read/write permissions
3. Configure network access (IP whitelist or 0.0.0.0/0)
4. Get connection string

## 🐳 Docker Deployment

### Local Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Production Docker Deployment

```bash
# Build production images
docker build -t internly-backend ./backend
docker build -t internly-frontend ./frontend

# Run with production environment
docker-compose -f docker-compose.prod.yml up -d
```

## ☁️ Cloud Platform Deployments

### Vercel (Frontend)

1. Connect GitHub repository
2. Set build settings:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
3. Add environment variables
4. Deploy

### Railway (Backend)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Heroku (Full-stack)

1. Create Heroku app
2. Add MongoDB Atlas add-on
3. Set environment variables
4. Deploy with Git:

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

## 🔒 Security Checklist

### SSL/HTTPS

- [ ] Enable HTTPS on all domains
- [ ] Configure SSL certificates
- [ ] Set up automatic redirects from HTTP to HTTPS

### Environment Variables

- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials
- [ ] Production secrets are different from development

### Database Security

- [ ] MongoDB Atlas network access configured
- [ ] Database user has minimal required permissions
- [ ] Connection string uses SSL

### API Security

- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Helmet security headers enabled
- [ ] Input validation implemented

## 📊 Monitoring & Analytics

### Error Tracking

- Set up Sentry for error monitoring
- Configure error reporting in production

### Performance Monitoring

- Set up Google Analytics
- Monitor API response times
- Set up uptime monitoring

### Logging

- Configure Winston logging
- Set up log aggregation (if needed)
- Monitor application logs

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Post-Deployment Checklist

### Testing

- [ ] Test user registration/login
- [ ] Test Gmail integration
- [ ] Test job CRUD operations
- [ ] Test analytics and charts
- [ ] Test responsive design on mobile

### Performance

- [ ] Check page load times
- [ ] Verify API response times
- [ ] Test with multiple users
- [ ] Monitor memory usage

### Security

- [ ] Run security audit
- [ ] Test authentication flows
- [ ] Verify HTTPS redirects
- [ ] Check CORS configuration

## 📞 Support & Maintenance

### Monitoring

- Set up uptime monitoring
- Configure error alerts
- Monitor database performance

### Backups

- Set up automated database backups
- Test backup restoration process
- Document recovery procedures

### Updates

- Schedule regular dependency updates
- Plan for feature updates
- Maintain security patches
