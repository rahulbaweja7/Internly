import React, { useMemo, useRef, useState } from 'react';
import { Navbar } from './Navbar';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config/config';
import { User, Shield, Plug, Database, CreditCard } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') || 'profile';
  const setActive = (tab) => setParams((p) => { p.set('tab', tab); return p; });

  const nameInitial = useMemo(() => (user?.name ? user.name[0]?.toUpperCase() : 'U'), [user]);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.picture || '');
  const fileInputRef = useRef(null);
  
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
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-semibold">{nameInitial}</span>
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
                              'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined,
                            },
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
                  </div>
                </div>
              </section>
            </div>
          )}

          {active !== 'profile' && (
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


