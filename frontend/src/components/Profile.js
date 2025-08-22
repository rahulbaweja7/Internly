import React from 'react';
import config from '../config/config';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Navbar } from './Navbar';
import ContributionHeatmap from './ContributionHeatmap';
import { useProfileStats } from '../lib/hooks/useProfileStats';

export function Profile() {
  const { user, logout } = useAuth();
  const { total, last7, streak, rankFriends, jobs } = useProfileStats(user?._id);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-4">Your Profile</h1>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="h-16 w-16 rounded-full border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{user?.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Last 7 days</div>
                  <div className="text-2xl font-semibold leading-tight">{last7}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-2xl font-semibold leading-tight">{total}</div>
                </div>
                <div className="rounded-md border p-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                      <div className="text-2xl font-semibold leading-tight">{streak} days</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Rank (friends)</div>
                      <div className="text-2xl font-semibold leading-tight">{rankFriends ?? '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <Button variant="outline" onClick={() => (window.location.href = '/settings?tab=profile')}>Edit Profile</Button>
              </div>
            </CardContent>
          </Card>

          <ContributionHeatmap internships={jobs} weeksToShow={28} />
        </div>

        {/* Security and Data sections moved to Settings → Data & privacy */}
      </div>
    </div>
  );
}

export default Profile;


