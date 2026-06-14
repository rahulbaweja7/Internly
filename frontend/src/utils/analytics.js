import posthog from 'posthog-js';

const KEY = process.env.REACT_APP_POSTHOG_KEY;

// Only active in production with a key set. All functions are no-ops otherwise
// so no dev noise and no accidental test data in the PostHog dashboard.
const enabled = !!KEY && process.env.NODE_ENV === 'production';

export function initAnalytics() {
  if (!enabled) return;
  posthog.init(KEY, {
    api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,          // auto page-view on every route change
    capture_pageleave: true,         // session duration
    autocapture: false,              // only track explicit events below
    person_profiles: 'identified_only', // no anonymous profiles before login
  });
}

/** Call once after login/signup with the internal user ID (never the email). */
export function identifyUser(userId, traits = {}) {
  if (!enabled) return;
  posthog.identify(String(userId), traits);
}

/** Generic event capture. Keep property values non-PII (counts, enums, booleans). */
export function trackEvent(event, properties = {}) {
  if (!enabled) return;
  posthog.capture(event, properties);
}

/** Reset PostHog identity on logout. */
export function resetUser() {
  if (!enabled) return;
  posthog.reset();
}
