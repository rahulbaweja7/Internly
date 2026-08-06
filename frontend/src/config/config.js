// Each branch is built lazily inside its own case — as a single object
// literal, the production branch's throw would evaluate eagerly even
// when environment is 'test' or 'development', since all three values
// of a plain object are constructed up front regardless of which key
// is read.
function getConfig(environment) {
  switch (environment) {
    case 'production':
      return {
        API_BASE_URL: process.env.REACT_APP_API_URL || (() => { throw new Error('REACT_APP_API_URL is not set'); })(),
        GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
        ANALYTICS_ID: process.env.REACT_APP_ANALYTICS_ID
      };
    case 'test':
      return {
        API_BASE_URL: 'http://localhost:3001',
        GOOGLE_CLIENT_ID: 'test-client-id',
        SENTRY_DSN: null,
        ANALYTICS_ID: null
      };
    case 'development':
    default:
      return {
        API_BASE_URL: 'http://localhost:3001',
        GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        SENTRY_DSN: null,
        ANALYTICS_ID: null
      };
  }
}

const environment = process.env.NODE_ENV || 'development';
export default getConfig(environment);
