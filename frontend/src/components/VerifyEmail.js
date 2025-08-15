import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';
import config from '../config/config';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.post(`${config.API_BASE_URL}/api/auth/verify-email`, { token });
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Email verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black dark:bg-white">
            <Mail className="h-8 w-8 text-white dark:text-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Email Verification</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Verifying your email address</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Verified!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <Button onClick={() => navigate('/login')} className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                Continue to Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Verification Failed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/login')} className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                  Go to Sign In
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')} className="w-full">
                  Create New Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
