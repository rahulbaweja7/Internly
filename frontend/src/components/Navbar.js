import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  ArrowRight,
  Home,
  BarChart3,
  TrendingUp,
  Plus,
  Clock,
  Mail
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import StreakBadge from './ui/StreakBadge';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { jobs } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(null);
  const userMenuRef = useRef(null);

  const isAuthenticated = !!user;
  const isDashboard = location.pathname === '/dashboard';
  const isAnalytics = location.pathname === '/analytics';
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  // Calculate streak from global jobs data
  useEffect(() => {
    if (!isAuthenticated || !jobs) {
      setStreakDays(null);
      try { localStorage.removeItem('streakDays'); } catch (_) {}
      return;
    }

    // Check if we have cached data that's less than 30 seconds old
    const cached = localStorage.getItem('streakDays');
    const cachedTime = localStorage.getItem('streakDaysTime');
    const now = Date.now();
    
    if (cached && cachedTime && (now - parseInt(cachedTime)) < 30000) {
      setStreakDays(parseInt(cached));
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

      // Align with heatmap: streak only counts if there's activity today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!dates.has(formatLocalYmd(today))) return 0;

      // Count consecutive days backward starting from today
      let count = 0;
      const probe = new Date(today);
      // Cap loop to a reasonable window to avoid infinite loops
      for (let i = 0; i < 400; i += 1) {
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

    const value = computeStreak(jobs);
    setStreakDays(value);
    try { 
      localStorage.setItem('streakDays', String(value)); 
      localStorage.setItem('streakDaysTime', String(now));
    } catch (_) {}
  }, [isAuthenticated, jobs]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Landing page navbar
  if (isLanding) {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              <div>
                <span className="font-bold text-xl text-black dark:text-white">Applycation</span>
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
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-4 py-2 space-y-1">
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
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Login page navbar
  if (isLogin) {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              <div>
                <span className="font-bold text-xl text-black dark:text-white">Applycation</span>
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
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated navbar (Dashboard, Analytics, etc.)
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
              <div>
                <span className="font-bold text-xl text-black dark:text-white">Applycation</span>
                <p className="text-xs text-gray-500 -mt-1">Career Tracker</p>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search internships... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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
          </div>

          {/* Right side - Navigation and User menu */}
          <div className="hidden md:flex items-center space-x-4">
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

            <Button 
              onClick={() => navigate('/add')}
              className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Internship
            </Button>

            {/* User menu group */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700" ref={userMenuRef}>
              {isAuthenticated && (
                <div className="hidden md:inline-flex">
                  <StreakBadge
                    days={typeof streakDays === 'number' ? streakDays : 0}
                    className="justify-center"
                    variant="compact"
                  />
                </div>
              )}
              <ThemeToggle />
              
              <div
                className="flex items-center space-x-2 cursor-pointer relative"
                onClick={() => setIsUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                {user?.picture && (user.picture.startsWith('data:image') || user.picture.startsWith('https://')) ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </span>
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
                      <Settings className="h-4 w-4" /> Settings
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
                        navigate('/import/gmail');
                      }}
                      role="menuitem"
                    >
                      <Mail className="h-4 w-4" />
                      Import Gmail
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-2 space-y-1">
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
                    {user?.picture && (user.picture.startsWith('data:image') || user.picture.startsWith('https://')) ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name || user?.email}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 