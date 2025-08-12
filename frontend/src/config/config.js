const config = {
  development: {
    API_BASE_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    SENTRY_DSN: null,
    ANALYTICS_ID: null
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://api.yourdomain.com',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    ANALYTICS_ID: process.env.REACT_APP_ANALYTICS_ID
  },
  test: {
    API_BASE_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: 'test-client-id',
    SENTRY_DSN: null,
    ANALYTICS_ID: null
  }
};

const environment = process.env.NODE_ENV || 'development';
export default config[environment];
