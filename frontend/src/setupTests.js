// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Force axios to use its CommonJS build in Jest to avoid ESM parse errors
jest.mock('axios', () => require('axios/dist/node/axios.cjs'));

// Stub out heavy charting libs that depend on Canvas/WebGL
jest.mock('react-plotly.js', () => () => null);

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
