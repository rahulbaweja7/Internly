import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

// applyAccent is module-private; exercise it through the provider by changing
// accent/mode and reading the CSS variables it writes onto <html>.
function AccentProbe() {
  const { setAccent, setMode } = useTheme();
  return (
    <div>
      <button onClick={() => setAccent('violet')}>violet</button>
      <button onClick={() => setAccent('does-not-exist')}>unknown</button>
      <button onClick={() => setMode('dark')}>dark</button>
    </div>
  );
}

const primaryVar = () => document.documentElement.style.getPropertyValue('--primary');

afterEach(() => {
  document.documentElement.style.cssText = '';
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('ThemeContext applyAccent', () => {
  it('applies the default (blue) accent on mount', () => {
    render(<ThemeProvider><AccentProbe /></ThemeProvider>);
    expect(primaryVar()).toBe('221.2 83.2% 53.3%');
  });

  it('updates --primary when the accent changes', () => {
    render(<ThemeProvider><AccentProbe /></ThemeProvider>);
    fireEvent.click(screen.getByText('violet'));
    expect(primaryVar()).toBe('262.1 83.3% 57.8%'); // violet, light variant
  });

  it('falls back to the first accent for an unknown id', () => {
    render(<ThemeProvider><AccentProbe /></ThemeProvider>);
    fireEvent.click(screen.getByText('unknown'));
    expect(primaryVar()).toBe('221.2 83.2% 53.3%'); // blue (ACCENT_COLORS[0])
  });

  it('uses the dark variant of the accent in dark mode', () => {
    render(<ThemeProvider><AccentProbe /></ThemeProvider>);
    fireEvent.click(screen.getByText('violet'));
    fireEvent.click(screen.getByText('dark'));
    expect(primaryVar()).toBe('262.1 83.3% 65%'); // violet, dark variant
  });
});
