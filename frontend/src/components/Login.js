import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Building, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import config from '../config/config';

export function Login() {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.name || user?.fullName || user?.email || '')
    .toString()
    .split(' ')[0]
    .split('@')[0];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/auth/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }, { withCredentials: true });

      // Server sets HttpOnly cookie; cache user locally for UX
      localStorage.setItem('user', JSON.stringify(response.data.user));
      updateUser(response.data.user);

      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = `${config.API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen relative bg-white dark:bg-gray-950 flex items-center justify-center p-6 animate-fade-in">
      {/* Aesthetic background: mesh gradient + film grain (dark mode only) */}
      <div className="absolute inset-0 -z-10">
        <div className="hidden dark:block absolute inset-0 bg-mesh" />
        <div className="hidden dark:block absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay pointer-events-none" />
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left side - Welcome content */}
        <div className="text-center lg:text-left space-y-6 animate-slide-in-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Applycation</h1>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-gray-100">
              Track Your Career
              <br />
              Journey
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
              Manage your internship applications, track your progress, and land your dream job with our intelligent application tracker.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="group rounded-xl p-[1px] bg-gradient-to-r from-rose-400/40 via-amber-400/40 to-sky-400/40">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 transition-all group-hover:bg-white/95 dark:group-hover:bg-gray-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Building className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Track Applications</span>
              </div>
            </div>
            <div className="group rounded-xl p-[1px] bg-gradient-to-r from-sky-400/40 via-indigo-400/40 to-purple-400/40">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 transition-all group-hover:bg-white/95 dark:group-hover:bg-gray-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Monitor Progress</span>
              </div>
            </div>
            <div className="group rounded-xl p-[1px] bg-gradient-to-r from-emerald-400/40 via-teal-400/40 to-cyan-400/40">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 transition-all group-hover:bg-white/95 dark:group-hover:bg-gray-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Smart Insights</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">85%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex justify-center animate-slide-in-right">
          <div className="w-full max-w-md rounded-2xl p-[1px] bg-gradient-to-r from-rose-400/40 via-amber-400/40 to-sky-400/40">
          <Card className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-[#0f1424]/95 border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-rose-400 via-amber-400 to-sky-400" />
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md">
                <Sparkles className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{greeting}{firstName ? `, ${firstName}` : ''} 👋</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Welcome back! Sign in to continue your career journey.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Google Sign In Button */}
              <Button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:from-rose-400 hover:to-amber-400 transition-transform hover:scale-[1.01]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <p>
                  By signing in, you agree to our{' '}
                  <Link to="/terms" className="text-gray-900 dark:text-gray-100 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-gray-900 dark:text-gray-100 hover:underline">Privacy Policy</Link>
                </p>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-gray-900 dark:text-gray-100 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        .bg-mesh {
          background-image:
            radial-gradient(60% 60% at 0% 0%, rgba(253,164,175,0.14) 0%, transparent 60%),
            radial-gradient(60% 60% at 100% 0%, rgba(251,191,36,0.14) 0%, transparent 60%),
            radial-gradient(70% 70% at 20% 100%, rgba(147,197,253,0.12) 0%, transparent 60%),
            radial-gradient(80% 80% at 100% 100%, rgba(167,139,250,0.12) 0%, transparent 60%),
            linear-gradient(180deg, #0b1020 0%, #0b1222 40%, #0b1020 100%);
          background-repeat: no-repeat;
        }
        .bg-noise {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>");
          background-size: cover;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out 0.2s both; }
      `}</style>
    </div>
  );
} 