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
import { MapPin, Edit3, Save, Mail, X } from 'lucide-react';
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

  const statCards = [
    { label: 'Applications', value: stats.total, accent: 'border-t-blue-500' },
    { label: 'Last 7 days',   value: stats.last7,       accent: 'border-t-violet-500' },
    { label: 'Day streak',    value: `${stats.streak}d`, accent: 'border-t-orange-500' },
    { label: 'Acceptance',    value: `${stats.acceptRate}%`, accent: 'border-t-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div
        className={`max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5 transition-all duration-300
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        {/* ── Profile hero card ─────────────────────────────────── */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          {/* Dark banner with subtle depth — intentional, not soup */}
          <div
            className="h-24 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0d0d1a 0%, #111127 40%, #0a0a14 100%)',
            }}
          >
            {/* Two soft glows — very low opacity, large radius */}
            <div className="absolute -top-8 left-12 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -top-4 right-8 w-40 h-40 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />
            {/* Dot texture overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <CardContent className="px-6 pb-6">
            {/* Avatar + action row */}
            <div className="flex items-end justify-between -mt-9 mb-4">
              <Avatar className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border-[3px] border-background shadow-xl ring-1 ring-border">
                <AvatarImage
                  className="aspect-square h-full w-full object-cover"
                  src={
                    user.picture &&
                    (user.picture.startsWith('data:image') || user.picture.startsWith('https://'))
                      ? user.picture
                      : undefined
                  }
                  alt={user.name ?? ''}
                />
                <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>

              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-8 text-xs gap-1.5 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSaveProfile}
                    disabled={saving}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {/* Identity */}
            <h1 className="text-xl font-bold text-foreground leading-tight">{user.name}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {user.email}
              </span>
              {location && !isEditing && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {location}
                </span>
              )}
            </div>

            {bio && !isEditing && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">{bio}</p>
            )}

            {/* Edit fields */}
            {isEditing && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="mt-1.5 h-9 text-sm"
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
                    rows={2}
                    className="mt-1.5 text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Stat cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(({ label, value, accent }) => (
            <Card
              key={label}
              className={`border-t-2 ${accent} border-x-border/60 border-b-border/60 shadow-sm`}
            >
              <CardContent className="px-5 py-4">
                <p className="text-3xl font-bold tabular-nums text-foreground tracking-tight">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Activity + heatmap ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Activity feed — 3 of 5 columns */}
          <Card className="lg:col-span-3 border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/60 bg-muted/30">
              <CardTitle className="text-sm font-semibold text-foreground">
                Recent Applications
              </CardTitle>
            </CardHeader>
            {jobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {jobs.slice(0, 8).map((job) => (
                  <div
                    key={job._id}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors duration-100"
                  >
                    {/* Company initial */}
                    <div className="h-8 w-8 rounded-md bg-muted border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 select-none">
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
                        } border-0 text-xs font-medium`}
                      >
                        {job.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums hidden sm:block w-16 text-right">
                        {job.dateApplied
                          ? new Date(job.dateApplied).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Heatmap — 2 of 5 columns */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/60 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Activity</CardTitle>
                {stats.streak > 0 && (
                  <span className="text-xs font-semibold text-orange-500">
                    🔥 {stats.streak}-day streak
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pt-4 pb-5">
              <ContributionHeatmap internships={jobs} noCard={true} weeksToShow={14} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
