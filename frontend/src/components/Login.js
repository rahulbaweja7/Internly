import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Building, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import config from '../config/config';

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      });

      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Welcome content */}
        <div className="text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <h1 className="text-3xl font-bold text-black dark:text-black">
                Internly.
              </h1>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Track Your Career
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
              Manage your internship applications, track your progress, and land your dream job with our intelligent career tracker.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Track Applications</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Monitor Progress</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20">
              <Users className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Smart Insights</span>
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
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Sign in to continue your career journey
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Google Sign In Button */}
              <Button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
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
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
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
                      className="pl-10"
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
                      className="pl-10 pr-10"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
                  <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
                </p>
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 