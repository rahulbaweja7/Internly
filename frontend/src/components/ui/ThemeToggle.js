import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="w-9 h-9 p-0" aria-label="Theme menu">
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-background shadow-lg py-1 z-[1000]">
          <button className="w-full px-3 py-2 text-sm flex items-center justify-between hover:bg-muted" onClick={() => { setMode('light'); setOpen(false); }}>
            <span className="flex items-center gap-2"><Sun className="h-4 w-4"/> Light</span>
            {mode === 'light' && <Check className="h-4 w-4"/>}
          </button>
          <button className="w-full px-3 py-2 text-sm flex items-center justify-between hover:bg-muted" onClick={() => { setMode('dark'); setOpen(false); }}>
            <span className="flex items-center gap-2"><Moon className="h-4 w-4"/> Dark</span>
            {mode === 'dark' && <Check className="h-4 w-4"/>}
          </button>
        </div>
      )}
    </div>
  );
};
