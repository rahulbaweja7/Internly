import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config/config';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/ThemeToggle';
import StreakBadge from './ui/StreakBadge';
import { 
  Target, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  LogOut, 
  Plus, 
  Menu, 
  X, 
  Home,
  BarChart3,
  TrendingUp,
  Search
} from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Removed unused isSearchFocused state
  const [streakDays, setStreakDays] = useState(null);

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

  const isAuthenticated = !!user;
  const isDashboard = location.pathname === '/dashboard';
  const isAddJob = location.pathname === '/add';
  const isAnalytics = location.pathname === '/analytics';
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  // Fetch jobs and compute current streak for navbar badge
  useEffect(() => {
    if (!isAuthenticated) {
      setStreakDays(null);
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
      .then((res) => setStreakDays(computeStreak(res.data)))
      .catch(() => setStreakDays(null));
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavbarContent = () => {
    // Landing page navbar
    if (isLanding) {
      return (
        <>
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Internly
              </span>
              <p className="text-xs text-gray-500 -mt-1">Career Tracker</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Internly
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
          {isAddJob && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Internly
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
            className={isDashboard ? "bg-gradient-to-r from-blue-600 to-purple-600" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>

          <Button 
            variant={isAnalytics ? "default" : "ghost"}
            onClick={() => navigate('/analytics')}
            className={isAnalytics ? "bg-gradient-to-r from-blue-600 to-purple-600" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          {isAuthenticated && streakDays !== null && (
            <StreakBadge
              days={streakDays}
              onClick={() => navigate('/analytics')}
              className="hidden md:inline-flex"
            />
          )}

          <Button 
            onClick={() => {
              navigate('/add');
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Internship
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <ThemeToggle />
            
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/profile')}>
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
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
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
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
                        <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium dark:text-gray-100">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
} 