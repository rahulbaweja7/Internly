import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfileStats } from '../lib/hooks/useProfileStats';
import ContributionHeatmap from './ContributionHeatmap';
import { Navbar } from './Navbar';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { 
  MapPin, 
  User, 
  Target, 
  Trophy, 
  Flame, 
  Edit3, 
  Save,
  TrendingUp,
  Activity,
  Briefcase,
  Mail
} from 'lucide-react';
import config from '../config/config';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { loading, total, last7, streak, rankFriends, jobs } = useProfileStats(user?._id);
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const onSaveProfile = async () => {
    try {
      setSaving(true);
      updateUser({ bio, location });
      await fetch(`${config.API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio, location })
      });
      setIsEditing(false);
    } catch (_) { /* noop */ } finally { setSaving(false); }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setIsEditing(false);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Track your progress and manage your career journey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header Card */}
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
              <CardContent className="relative p-8">
                <div className="flex items-start space-x-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-20"></div>
                    <Avatar className="relative h-24 w-24 border-4 border-white dark:border-slate-700 shadow-xl">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4 mb-4">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </h2>
                      {!isEditing ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                          onClick={handleEdit}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                            onClick={onSaveProfile}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-slate-600 dark:text-slate-400 mb-6">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5" />
                        <span className="text-lg">{user.email}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5" />
                          <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="City, Country"
                            className="h-8 w-40 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                          />
                        </div>
                      ) : (
                        location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <span className="text-lg">{location}</span>
                          </div>
                        )
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <label className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Bio</span>
                        </label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none rounded-lg"
                        />
                      </div>
                    ) : (
                      bio && (
                        <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                          {bio}
                        </p>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">Last 7 days</p>
                  <p className="text-3xl font-bold">{last7}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-purple-100 text-sm font-semibold mb-1">Total</p>
                  <p className="text-3xl font-bold">{total}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Flame className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-orange-100 text-sm font-semibold mb-1">Streak</p>
                  <div className="flex items-center justify-center space-x-2">
                    <p className="text-3xl font-bold">{streak}</p>
                    <Badge className="bg-white/20 text-white border-0 rounded-full px-3 py-1">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-emerald-100 text-sm font-semibold mb-1">Rank</p>
                  <p className="text-3xl font-bold">{rankFriends || '-'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                  Access your most used features
                </CardDescription>
              </CardHeader>
              <CardContent>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 hover:scale-105"
                    onClick={() => window.location.href = '/dashboard?add=true'}
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold">Add Internship</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 hover:scale-105"
                    onClick={() => window.location.href = '/analytics'}
                  >
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-semibold">Analytics</span>
                  </Button>
                  
                  
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 hover:scale-105"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                      <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-semibold">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                  Your latest internship applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs?.slice(0, 8).map((job) => (
                    <div key={job._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-lg truncate">
                          {job.role}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-base truncate">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 ml-4">
                                                 <Badge 
                           className={
                             job.status === 'Applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-full' :
                             job.status === 'Interview' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-0 rounded-full' :
                             job.status === 'Offer' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 rounded-full' :
                             job.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0 rounded-full' :
                             job.status === 'Withdrawn' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-0 rounded-full' :
                             'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-0 rounded-full'
                           }
                         >
                           {job.status}
                         </Badge>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                          {new Date(job.dateApplied).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Heatmap */}
          <div className="space-y-8">
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Applications Heatmap
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                  Daily count of applications over the past year
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 rounded-full px-3 py-1">
                    <Flame className="h-4 w-4 mr-2" />
                    {streak}-day streak
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ContributionHeatmap internships={jobs} noCard={true} weeksToShow={14} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


