import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import config from '../config/config';
import axios from 'axios';
import { Navbar } from './Navbar';

export function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto p-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-16 w-16 rounded-full border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              )}
              <div>
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change your account password</p>
              </div>
              <Button variant="outline" disabled>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export applications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download your data as JSON/CSV</p>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await axios.get(`${config.API_BASE_URL}/api/auth/export`, { responseType: 'blob' });
                    const blob = new Blob([res.data], { type: 'application/json' });
                    const href = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = href;
                    a.download = 'internly-export.json';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(href);
                  } catch (e) {
                    alert('Failed to export data. Make sure you are logged in and CORS is configured.');
                  }
                }}
              >
                Export JSON
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete account</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Permanently remove your account and data</p>
              </div>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!window.confirm('This will permanently delete your account and all data. Continue?')) return;
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${config.API_BASE_URL}/api/auth/delete`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': token ? `Bearer ${token}` : undefined,
                      },
                    });
                    if (!res.ok) throw new Error('Delete failed');
                    // Clear client state
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                  } catch (e) {
                    alert('Failed to delete account.');
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Profile;


