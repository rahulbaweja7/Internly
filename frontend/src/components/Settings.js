import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config/config';
import { User, Shield, Plug, Database, CreditCard, FileDown, Trash2, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailIntegration } from './GmailIntegration';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { mode, setMode, setLightBackground } = useTheme();
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'profile';
  const setActive = (tab) => setParams((p) => { p.set('tab', tab); return p; });

  const nameInitial = useMemo(() => {
    console.log('User object:', user);
    console.log('User name:', user?.name);
    if (!user?.name) return 'U';
    
    // Clean the name and ensure it's valid
    const cleanName = user.name.trim();
    if (!cleanName || cleanName.length === 0) return 'U';
    
    // Check if the name looks like invalid data (contains "avatar" or similar)
    if (cleanName.toLowerCase().includes('avatar') || cleanName.toLowerCase().includes('avata')) {
      console.log('Invalid name detected, using fallback');
      return 'U';
    }
    
    const firstChar = cleanName[0];
    const initial = firstChar ? firstChar.toUpperCase() : 'U';
    console.log('Calculated initial:', initial);
    return initial;
  }, [user]);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  // Sync avatarPreview with user picture and clean invalid data
  useEffect(() => {
    console.log('User picture value:', user?.picture);
    
    // Check if picture contains invalid data and clear it
    if (user?.picture && (
      user.picture.toLowerCase().includes('avatar') || 
      user.picture.toLowerCase().includes('avata') ||
      (!user.picture.startsWith('data:image') && !user.picture.startsWith('https://'))
    )) {
      console.log('Invalid picture data detected, clearing...');
      // Clear invalid picture data
      updateUser({ picture: '' });
      setAvatarPreview('');
      
      // Also update on server
      fetch(`${config.API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ picture: '' })
      }).catch(() => {});
    } else if (user?.picture && (
      user.picture.startsWith('data:image') || 
      user.picture.startsWith('https://')
    )) {
      setAvatarPreview(user.picture);
    } else {
      setAvatarPreview('');
    }
  }, [user?.picture, updateUser]);
  
  // Helpers to persist avatar across refresh by storing a compact data URL
  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const downscaleDataUrl = (dataUrl, maxSize = 160) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'privacy', label: 'Data & privacy', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile, security, and data preferences.</p>
        </div>

        {/* Layout with sidebar nav */}
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <aside className="rounded-md border border-input bg-background p-2 h-max">
            <nav className="grid gap-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ' +
                      (isActive
                        ? 'bg-muted/60 text-foreground border border-input'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40')
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="py-0">
          {active === 'profile' && (
            <div className="space-y-6">
              {/* Profile card with avatar + name side-by-side for a distinct layout */}
              <section className="rounded-md border border-input bg-background p-4 md:p-6">
                <h2 className="text-base font-semibold mb-4">Profile</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-16 w-16 shrink-0 rounded-full ring-4 ring-muted/60 border border-input overflow-hidden group"
                    title="Change avatar"
                  >
                    {avatarPreview && (avatarPreview.startsWith('data:image') || avatarPreview.startsWith('https://')) ? (
                      <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg font-semibold text-white select-none">
                          {nameInitial && nameInitial.length === 1 ? nameInitial : 'U'}
                        </span>
                      </div>
                    )}
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await readFileAsDataURL(file);
                          const small = await downscaleDataUrl(dataUrl, 160);
                          setAvatarPreview(small);
                          updateUser({ picture: small });
                          await fetch(`${config.API_BASE_URL}/api/auth/me`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ picture: small })
                          }).catch(() => {});
                        } catch (_) { /* noop */ }
                      }}
                    />
                  </button>
                  <div className="flex-1">
                    <label className="text-xs uppercase text-muted-foreground">Display name</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Your name"
                      />
                      <button
                        type="button"
                        className="h-10 rounded-md px-4 text-sm bg-black text-white dark:bg-white dark:text-black"
                        onClick={() => {/* Persist later */}}
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Use up to 32 characters.</p>

                    <div className="mt-5">
                      <label className="text-xs uppercase text-muted-foreground">Connected email</label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          value={user?.email || ''}
                          readOnly
                          className="flex-1 h-10 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                        />
                        {user?.isEmailVerified ? (
                          <span className="text-xs text-green-600">Verified</span>
                        ) : (
                          <span className="text-xs text-yellow-600">Unverified</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">This is the email linked to your account.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="h-10 rounded-md px-4 text-sm border border-input text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 inline-flex items-center gap-2"
                    onClick={async () => {
                      if (!window.confirm('This will permanently delete your account and all data. Continue?')) return;
                      try {
                        const res = await fetch(`${config.API_BASE_URL}/api/auth/delete`, { method: 'DELETE', credentials: 'include' });
                        if (!res.ok) throw new Error('Delete failed');
                        localStorage.removeItem('user');
                        try { await logout(); } catch (_) {}
                        window.location.href = '/';
                      } catch (_) { /* noop */ }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      window.location.href = '/';
                    }}
                    className="h-10 rounded-md px-4 text-sm border border-input text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                  >
                    Log out
                  </button>
                </div>
              </section>
            </div>
          )}

          {active === 'security' && (
            <section className="rounded-md border border-input bg-background p-6">
              <h2 className="text-base font-semibold mb-4">Password</h2>
              <PasswordSection />
            </section>
          )}

          {active === 'integrations' && (
            <section className="rounded-md border border-input bg-background p-2 md:p-4">
              <GmailIntegration onApplicationsFound={() => {}} />
            </section>
          )}

          {active === 'privacy' && (
            <section className="grid gap-4">
              <div className="rounded-md border border-input bg-background p-6">
                <h3 className="text-lg font-semibold mb-1">Export applications</h3>
                <p className="text-sm text-muted-foreground mb-3">Download your data as JSON.</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 h-10 rounded-md px-4 text-sm bg-black text-white dark:bg-white dark:text-black"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${config.API_BASE_URL}/api/auth/export`, { credentials: 'include' });
                      if (!res.ok) throw new Error('Export failed');
                      const text = await res.text();
                      const blob = new Blob([text], { type: 'application/json' });
                      const href = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = href; a.download = 'internly-export.json';
                      document.body.appendChild(a); a.click(); a.remove();
                      window.URL.revokeObjectURL(href);
                    } catch (_) { /* noop */ }
                  }}
                >
                  <FileDown className="h-4 w-4" /> Export JSON
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <a href="/privacy" className="rounded-md border border-input bg-background p-6 block hover:bg-muted/40">
                  <h3 className="text-lg font-semibold mb-1">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">Understand how we collect, use, and protect your information.</p>
                  <div className="mt-4 inline-flex items-center text-sm">Privacy →</div>
                </a>
                <a href="/terms" className="rounded-md border border-input bg-background p-6 block hover:bg-muted/40">
                  <h3 className="text-lg font-semibold mb-1">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">Your rights and responsibilities when using the platform.</p>
                  <div className="mt-4 inline-flex items-center text-sm">Terms →</div>
                </a>
              </div>
            </section>
          )}

          {active === 'appearance' && (
            <section className="rounded-md border border-input bg-background p-6 space-y-6">
              <h2 className="text-base font-semibold">Appearance</h2>
              <div className="flex items-center gap-3">
                <button className={`px-3 py-1.5 rounded-md border ${mode==='light'?'bg-muted/60':'hover:bg-muted/30'}`} onClick={() => setMode('light')}>Light</button>
                <button className={`px-3 py-1.5 rounded-md border ${mode==='dark'?'bg-muted/60':'hover:bg-muted/30'}`} onClick={() => setMode('dark')}>Dark</button>
                <button className={`px-3 py-1.5 rounded-md border ${mode==='custom'?'bg-muted/60':'hover:bg-muted/30'}`} onClick={() => setMode('custom')}>Custom</button>
              </div>
              {mode === 'custom' && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">Background presets</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Soft Gray', hsl: '210 40% 98%' },
                      { name: 'Warm', hsl: '48 100% 97%' },
                      { name: 'Cool', hsl: '200 50% 97%' },
                      { name: 'Off‑white', hsl: '0 0% 98%' },
                    ].map((p) => (
                      <button key={p.name} className="px-3 py-1.5 rounded-md border hover:bg-muted/30" onClick={() => setLightBackground(p.hsl)}>{p.name}</button>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Custom background (HSL)</div>
                    <input type="text" placeholder="e.g., 210 40% 98%" className="w-full border rounded px-3 py-2 bg-background" onBlur={(e) => setLightBackground(e.target.value)} />
                    <div className="text-xs text-muted-foreground mt-1">Tip: try 210 40% 98% (soft gray) or 48 100% 97% (warm).</div>
                  </div>
                </div>
              )}
            </section>
          )}

          {active !== 'profile' && active !== 'security' && active !== 'integrations' && active !== 'privacy' && (
            <div className="rounded-md border border-input bg-background p-6 text-sm text-muted-foreground">
              {tabs.find((t) => t.id === active)?.label} coming soon.
            </div>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    setMessage('');
    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`${config.API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Failed to update password');
      });
      setMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setMessage(e.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-sm text-muted-foreground">{message}</div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase text-muted-foreground">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-muted-foreground">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-muted-foreground">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Repeat new password"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className="h-10 rounded-md px-4 text-sm bg-black text-white dark:bg-white dark:text-black disabled:opacity-60"
          disabled={isSaving}
          onClick={onSave}
        >
          {isSaving ? 'Saving…' : 'Save password'}
        </button>
      </div>
    </div>
  );
}


