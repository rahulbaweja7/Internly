// analytics.js freezes its `enabled` flag at module load (based on NODE_ENV
// and REACT_APP_POSTHOG_KEY), so each branch is exercised by resetting the
// module registry and re-requiring with different env.

const ORIGINAL_ENV = process.env.NODE_ENV;
const ORIGINAL_KEY = process.env.REACT_APP_POSTHOG_KEY;

const posthogMockFactory = () => ({
  __esModule: true,
  default: { init: jest.fn(), identify: jest.fn(), capture: jest.fn(), reset: jest.fn() },
});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  if (ORIGINAL_KEY === undefined) delete process.env.REACT_APP_POSTHOG_KEY;
  else process.env.REACT_APP_POSTHOG_KEY = ORIGINAL_KEY;
  jest.resetModules();
});

describe('analytics wrapper', () => {
  it('captures events when enabled (production + key set)', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_POSTHOG_KEY = 'phc_test_key';
    jest.doMock('posthog-js', posthogMockFactory);

    const analytics = require('./analytics');
    const posthog = require('posthog-js').default;

    analytics.initAnalytics();
    analytics.identifyUser('user-1');
    analytics.trackEvent('job_added', { status: 'Applied' });
    analytics.resetUser();

    expect(posthog.init).toHaveBeenCalledWith('phc_test_key', expect.any(Object));
    expect(posthog.identify).toHaveBeenCalledWith('user-1', {});
    expect(posthog.capture).toHaveBeenCalledWith('job_added', { status: 'Applied' });
    expect(posthog.reset).toHaveBeenCalled();
  });

  it('is a no-op outside production even when a key is set', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_POSTHOG_KEY = 'phc_test_key';
    jest.doMock('posthog-js', posthogMockFactory);

    const analytics = require('./analytics');
    const posthog = require('posthog-js').default;

    analytics.initAnalytics();
    analytics.identifyUser('user-1');
    analytics.trackEvent('job_added');
    analytics.resetUser();

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(posthog.reset).not.toHaveBeenCalled();
  });

  it('is a no-op in production when no key is set', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_POSTHOG_KEY;
    jest.doMock('posthog-js', posthogMockFactory);

    const analytics = require('./analytics');
    const posthog = require('posthog-js').default;

    analytics.trackEvent('job_added');
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
