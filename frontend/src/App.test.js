import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hero subtitle', () => {
  render(<App />);
  expect(screen.getByText(/Free Internship Tracking Platform/i)).toBeInTheDocument();
});
