import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Check system preference (guard for non-browser/test envs)
    try {
      const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
      const mql = hasMatchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      return !!(mql && typeof mql.matches === 'boolean' ? mql.matches : false);
    } catch (_) {
      return false;
    }
  });

  // High-level user-facing mode: 'light' | 'dark' | 'custom'
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('themeMode') || (JSON.parse(localStorage.getItem('darkMode') || 'false') ? 'dark' : 'light');
    } catch (_) {
      return 'light';
    }
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    try {
      const root = document.documentElement;
      if (next) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('darkMode', JSON.stringify(next));
    } catch (_) {}
    setIsDarkMode(next);
    setMode(next ? 'dark' : 'light');
  };

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('themeMode', mode);
    
    // Apply to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, mode]);

  // Listen for system theme changes
  useEffect(() => {
    const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
    if (!hasMatchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches);
      }
    };

    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    if (mediaQuery && typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    return undefined;
  }, []);

  const value = {
    isDarkMode,
    toggleDarkMode,
    mode,
    setMode: (nextMode) => {
      try {
        if (nextMode === 'dark') {
          document.documentElement.classList.add('dark');
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          setIsDarkMode(false);
        }
        localStorage.setItem('themeMode', nextMode);
      } catch (_) {}
      setMode(nextMode);
    },
    // Optional: expose a way to set custom light background via CSS var
    setLightBackground: (hslString) => {
      try {
        document.documentElement.style.setProperty('--background', hslString);
      } catch (_) {}
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
