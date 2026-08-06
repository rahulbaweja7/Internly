// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Force axios to use its CommonJS build in Jest to avoid ESM parse errors
jest.mock('axios', () => require('axios/dist/node/axios.cjs'));

// @vercel/speed-insights/react uses an `exports` map that Jest 27 (bundled by
// react-scripts 5) can't resolve even though the file exists on disk. It's an
// analytics no-op outside production anyway, so stub it out in tests.
jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}), { virtual: true });

// Polyfill/override matchMedia for components that query color scheme
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// jsdom doesn't implement IntersectionObserver — used by LandingPage's
// scroll-reveal (FadeIn) — so provide a no-op stand-in. A plain class
// (not jest.fn().mockImplementation(() => ({...}))) so `new` behaves
// unambiguously — jest's mock-constructor wrapping doesn't reliably
// forward an arrow function's returned object as the constructed value.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;
