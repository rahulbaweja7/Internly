import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
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
  Settings,
  Bell,
  Search
} from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = !!user;
  const isDashboard = location.pathname === '/dashboard';
  const isAddJob = location.pathname === '/add';
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavbarContent = () => {
    // Landing page navbar
    if (isLanding) {
      return (
        <>
          <div className="flex items-center space-x-3">
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
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              Features
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              About
            </Button>
            <Button 
              onClick={() => navigate('/login')}
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
          <div className="flex items-center space-x-3">
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
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
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
          
          <div className="flex items-center space-x-3">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search internships..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Navigation buttons */}
          <Button 
            variant={isDashboard ? "default" : "ghost"}
            onClick={() => navigate('/dashboard')}
            className={isDashboard ? "bg-gradient-to-r from-blue-600 to-purple-600" : "text-gray-600 hover:text-gray-900"}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>

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
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center space-x-2">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="h-8 w-8 rounded-full border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 transition-colors"
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
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {getNavbarContent()}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {isLanding && (
                <>
                  <Button variant="ghost" className="w-full justify-start text-gray-600">
                    Features
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-600">
                    Pricing
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-600">
                    About
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
              
              {isAuthenticated && (
                <>
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
                    onClick={() => {
                      navigate('/add');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Internship
                  </Button>
                  <div className="border-t border-gray-200 pt-2">
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
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-red-600 hover:text-red-700"
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