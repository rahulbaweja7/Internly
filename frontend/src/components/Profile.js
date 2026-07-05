import React, { useState, useMemo, useEffect } from 'react';
import { STATUS_BADGE_CLASS } from '../constants/jobStatuses';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import ContributionHeatmap from './ContributionHeatmap';
import { Navbar } from './Navbar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { MapPin, Edit3, Save, Mail } from 'lucide-react';
import config from '../config/config';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { jobs, loading } = useData();
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const stats = useMemo(() => {
    const countLastNDays = (days) => {
      const since = Date.now() - days * 24 * 60 * 60 * 1000;
      return jobs.reduce((acc, j) => {
        const t = new Date(j.dateApplied || j.appliedDate || j.createdAt).getTime();
        return acc + (isNaN(t) ? 0 : t >= since ? 1 : 0);
      }, 0);
    };

    const total = jobs.length;
    const last7 = countLastNDays(7);

    const dates = new Set();
    const fmt = (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };
    jobs.forEach((j) => {
      const raw = j.dateApplied || j.appliedDate || j.createdAt;
      if (raw) dates.add(fmt(raw));
    });

    let streak = 0;
    if (dates.size > 0) {
      const probe = new Date();
      probe.setHours(0, 0, 0, 0);
      for (let i = 0; i < 400; i++) {
        if (dates.has(fmt(probe))) { streak++; probe.setDate(probe.getDate() - 1); }
        else break;
      }
    }

    const accepted = jobs.filter(j => j.status === 'Accepted').length;
    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, last7, streak, acceptRate };
  }, [jobs]);

  const onSaveProfile = async () => {
    try {
      setSaving(true);
      updateUser({ bio, location });
      await fetch(`${config.API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio, location }),
      });
      setIsEditing(false);
    } catch (_) {
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setIsEditing(false);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 py-10 transition-all duration-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ───────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile card */}
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage
                        src={
                          user.picture &&
                          (user.picture.startsWith('data:image') || user.picture.startsWith('https://'))
                            ? user.picture
                            : undefined
                        }
                        alt={user.name ?? ''}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white text-lg font-semibold">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h1 className="text-lg font-semibold text-foreground leading-tight">
                        {user.name}
                      </h1>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>{user.email}</span>
                      </div>
                      {location && !isEditing && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit / Save / Cancel */}
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="shrink-0 text-muted-foreground"
                    >
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSaveProfile}
                        disabled={saving}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={saving}
                        className="text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Edit fields */}
                {isEditing ? (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Location
                      </label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Bio
                      </label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="A short bio…"
                        rows={3}
                        className="mt-1.5 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  bio && (
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{bio}</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Stats row */}
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-4 divide-x divide-border">
                  {[
                    { label: 'Total', value: stats.total },
                    { label: 'Last 7 days', value: stats.last7 },
                    { label: 'Streak', value: `${stats.streak}d` },
                    { label: 'Acceptance', value: `${stats.acceptRate}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="py-5 text-center">
                      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent applications */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-3">
                {jobs.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">No applications yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {jobs.slice(0, 8).map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors duration-150"
                      >
                        {/* Company initial */}
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 select-none">
                          {job.company ? job.company.charAt(0).toUpperCase() : '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{job.role}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.company}
                            {job.location ? ` · ${job.location}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            className={`${
                              STATUS_BADGE_CLASS[job.status] || 'bg-muted text-muted-foreground'
                            } border-0 text-xs`}
                          >
                            {job.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                            {job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right column — heatmap ─────────────────────────── */}
          <div>
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Activity
                </CardTitle>
                {stats.streak > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {stats.streak}-day streak 🔥
                  </p>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-5">
                <ContributionHeatmap internships={jobs} noCard={true} weeksToShow={14} />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
