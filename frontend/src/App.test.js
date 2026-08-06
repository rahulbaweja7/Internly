import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page hero', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  expect(screen.getByText(/stop tracking/i)).toBeInTheDocument();
});
