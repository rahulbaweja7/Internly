import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ACCENT_COLORS = [
  {
    id: 'blue', name: 'Blue', hex: '#3b82f6',
    light: { primary: '221.2 83.2% 53.3%', ring: '221.2 83.2% 53.3%', fg: '210 40% 98%' },
    dark:  { primary: '217.2 91.2% 59.8%', ring: '224.3 76.3% 94.1%', fg: '222.2 84% 4.9%' },
  },
  {
    id: 'violet', name: 'Violet', hex: '#8b5cf6',
    light: { primary: '262.1 83.3% 57.8%', ring: '262.1 83.3% 57.8%', fg: '210 40% 98%' },
    dark:  { primary: '262.1 83.3% 65%',   ring: '262.1 83.3% 90%',   fg: '222.2 84% 4.9%' },
  },
  {
    id: 'rose', name: 'Rose', hex: '#f43f5e',
    light: { primary: '346.8 77.2% 49.8%', ring: '346.8 77.2% 49.8%', fg: '210 40% 98%' },
    dark:  { primary: '346.8 77.2% 62%',   ring: '346.8 77.2% 90%',   fg: '222.2 84% 4.9%' },
  },
  {
    id: 'orange', name: 'Orange', hex: '#f97316',
    light: { primary: '24.6 95% 53.1%', ring: '24.6 95% 53.1%', fg: '210 40% 98%' },
    dark:  { primary: '24.6 95% 60%',   ring: '24.6 95% 88%',   fg: '222.2 84% 4.9%' },
  },
  {
    id: 'emerald', name: 'Emerald', hex: '#10b981',
    light: { primary: '160 84.1% 39.4%', ring: '160 84.1% 39.4%', fg: '210 40% 98%' },
    dark:  { primary: '160 84.1% 50%',   ring: '160 84.1% 85%',   fg: '222.2 84% 4.9%' },
  },
  {
    id: 'cyan', name: 'Cyan', hex: '#06b6d4',
    light: { primary: '189 94.5% 43.1%', ring: '189 94.5% 43.1%', fg: '210 40% 98%' },
    dark:  { primary: '189 94.5% 50%',   ring: '189 94.5% 85%',   fg: '222.2 84% 4.9%' },
  },
  {
    id: 'slate', name: 'Slate', hex: '#64748b',
    light: { primary: '215 25% 35%',   ring: '215 25% 35%',   fg: '210 40% 98%' },
    dark:  { primary: '215 20% 65%',   ring: '215 20% 88%',   fg: '222.2 84% 4.9%' },
  },
];

function applyAccent(accentId, isDark) {
  const accent = ACCENT_COLORS.find((a) => a.id === accentId) || ACCENT_COLORS[0];
  const vars = isDark ? accent.dark : accent.light;
  const root = document.documentElement;
  root.style.setProperty('--primary', vars.primary);
  root.style.setProperty('--primary-foreground', vars.fg);
  root.style.setProperty('--ring', vars.ring);
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    try {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
      return !!(mql?.matches);
    } catch (_) {
      return false;
    }
  });

  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem('themeMode') || (JSON.parse(localStorage.getItem('darkMode') || 'false') ? 'dark' : 'light');
    } catch (_) {
      return 'light';
    }
  });

  const [accentId, setAccentId] = useState(() => {
    return localStorage.getItem('accentColor') || 'blue';
  });

  // Apply accent CSS vars whenever accent or dark mode changes
  useEffect(() => {
    applyAccent(accentId, isDarkMode);
  }, [accentId, isDarkMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme-transitioning', '');
      if (next) root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem('darkMode', JSON.stringify(next));
      setTimeout(() => root.removeAttribute('data-theme-transitioning'), 300);
    } catch (_) {}
    setIsDarkMode(next);
    setModeState(next ? 'dark' : 'light');
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('themeMode', mode);
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode, mode]);

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    const handleChange = (e) => {
      if (localStorage.getItem('darkMode') === null) setIsDarkMode(e.matches);
    };
    mql.addEventListener?.('change', handleChange) ?? mql.addListener?.(handleChange);
    return () => mql.removeEventListener?.('change', handleChange) ?? mql.removeListener?.(handleChange);
  }, []);

  const setMode = (nextMode) => {
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme-transitioning', '');
      if (nextMode === 'dark') {
        root.classList.add('dark');
        setIsDarkMode(true);
      } else {
        root.classList.remove('dark');
        setIsDarkMode(false);
      }
      localStorage.setItem('themeMode', nextMode);
      setTimeout(() => root.removeAttribute('data-theme-transitioning'), 300);
    } catch (_) {}
    setModeState(nextMode);
  };

  const setAccent = (id) => {
    setAccentId(id);
    localStorage.setItem('accentColor', id);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, mode, setMode, accentId, setAccent, ACCENT_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};
