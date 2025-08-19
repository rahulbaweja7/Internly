import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config/config';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/ThemeToggle';
import StreakBadge from './ui/StreakBadge';
import { 
  ArrowRight, 
  
  User, 
  Plus, 
  Menu, 
  X, 
  Home,
  BarChart3,
  TrendingUp,
  Search,
  Clock,
  Mail
} from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  // Removed unused isSearchFocused state
  const [streakDays, setStreakDays] = useState(() => {
    try {
      const cached = localStorage.getItem('streakDays');
      return cached !== null ? Number(cached) : null;
    } catch (_) {
      return null;
    }
  });

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search internships..."]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user menu on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const isAuthenticated = !!user;
  const isDashboard = location.pathname === '/dashboard';
  
  const isAnalytics = location.pathname === '/analytics';
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  // Fetch jobs and compute current streak for navbar badge
  useEffect(() => {
    if (!isAuthenticated) {
      setStreakDays(null);
      try { localStorage.removeItem('streakDays'); } catch (_) {}
      return;
    }
    const formatLocalYmd = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const computeStreak = (jobs) => {
      const dates = new Set();
      (jobs || []).forEach((j) => {
        const raw = j.dateApplied || j.appliedDate;
        if (!raw) return;
        const d = new Date(raw);
        if (!isNaN(d)) dates.add(formatLocalYmd(d));
      });
      if (dates.size === 0) return 0;

      // Find most recent day with an application (<= today)
      const probe = new Date();
      probe.setHours(0, 0, 0, 0);
      let startFound = false;
      while (!startFound) {
        const key = formatLocalYmd(probe);
        if (dates.has(key)) {
          startFound = true;
          break;
        }
        // if we haven't found any within 400 days, stop
        probe.setDate(probe.getDate() - 1);
        if (probe < new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)) return 0;
      }

      // Count consecutive days backward from the most recent day with activity
      let count = 0;
      while (true) {
        const key = formatLocalYmd(probe);
        if (dates.has(key)) {
          count += 1;
          probe.setDate(probe.getDate() - 1);
        } else {
          break;
        }
      }
      return count;
    };

    axios
      .get(`${config.API_BASE_URL}/api/jobs`)
      .then((res) => {
        const value = computeStreak(res.data);
        setStreakDays(value);
        try { localStorage.setItem('streakDays', String(value)); } catch (_) {}
      })
      .catch(() => {
        // Keep previous cached value to avoid UI flicker
      });
  }, [isAuthenticated]);

  // logout moved to Profile page

  const getNavbarContent = () => {
    // Landing page navbar
    if (isLanding) {
      return (
        <>
            <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div>
              <span className="font-bold text-xl text-black dark:text-white">
                Applycation
              </span>
              <p className="text-xs text-gray-500 -mt-1">Application Tracker</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 shadow hover:shadow-md transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </>
      );
    }

    // Login page navbar
    if (isLogin) {
      return (
        <>
            <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div>
              <span className="font-bold text-xl text-black dark:text-white">
                Applycation
              </span>
              <p className="text-xs text-gray-500 -mt-1">Career Tracker</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </>
      );
    }

    // Authenticated navbar (Dashboard, Add Job, etc.)
    return (
      <>
        <div className="flex items-center space-x-4">
          
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div>
              <span className="font-bold text-xl text-black dark:text-white">
                Applycation
              </span>
              <p className="text-xs text-gray-500 -mt-1">Career Tracker</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search internships... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // focus handlers removed (no-op)
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery('');
                }
              }}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  navigate('/dashboard');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation buttons */}
          <Button 
            variant={isDashboard ? "default" : "ghost"}
            onClick={() => navigate('/dashboard')}
            className={isDashboard ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>

          <Button 
            variant={isAnalytics ? "default" : "ghost"}
            onClick={() => navigate('/analytics')}
            className={isAnalytics ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          {/* Friends and Leaderboards removed */}

          {isAuthenticated && (
            <div className="hidden md:inline-flex">
              <div className="min-w-[64px]">
            <StreakBadge
                  days={typeof streakDays === 'number' ? streakDays : 0}
                  className="w-full justify-center"
                  variant="compact"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={() => {
              navigate('/add');
            }}
            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Internship
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700" ref={userMenuRef}>
            <ThemeToggle />
            
            <div
              className="flex items-center space-x-2 cursor-pointer relative"
              onClick={() => setIsUserMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-900 dark:bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-10 z-[10000] w-48 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1"
                >
                  
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2" onClick={() => { setIsUserMenuOpen(false); navigate('/profile'); }} role="menuitem">
                    <User className="h-4 w-4" /> Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2" onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }} role="menuitem">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73h.09a2 2 0 1 1 0 4h-.09c-.66 0-1.3.26-1.77.73-.47.47-.73 1.11-.73 1.77Z"/></svg>
                    Settings
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/activity');
                    }}
                    role="menuitem"
                  >
                    <Clock className="h-4 w-4" />
                    My Activity
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/contact');
                    }}
                    role="menuitem"
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </button>
              </div>
              )}
            </div>

            {/* Logout moved to Profile page */}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </>
    );
  };

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {getNavbarContent()}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-4 py-2 space-y-1">
              {isLanding && (
                <>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
                    <ThemeToggle />
                  </div>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                    className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                </>
              )}
              
              {isAuthenticated && (
                <>
                  {typeof streakDays === 'number' && streakDays !== null && (
                    <div className="w-full flex justify-start px-3">
                      <StreakBadge days={streakDays} onClick={() => navigate('/analytics')} />
                    </div>
                  )}
                  <Button 
                    variant={isDashboard ? "default" : "ghost"}
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant={isAnalytics ? "default" : "ghost"}
                    onClick={() => {
                      navigate('/analytics');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button 
                    onClick={() => {
                      navigate('/add');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Internship
                  </Button>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex items-center space-x-2 px-3 py-2">
                      {user?.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-900 dark:bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {/* Name/email moved to Profile page */}
                    </div>
                    {/* Logout moved to Profile page */}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to offset fixed navbar height */}
      <div className="h-16" />
    </>
  );
} 