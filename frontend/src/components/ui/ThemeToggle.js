import React from 'react';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, setMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setMode(isDarkMode ? 'light' : 'dark')}
      className={`w-9 h-9 p-0 ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};
