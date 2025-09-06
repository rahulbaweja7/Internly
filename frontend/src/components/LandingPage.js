import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ArrowRight, Search, Bell, TrendingUp, Users as UsersIcon, ShieldCheck, MailCheck, Lock, Github, XCircle } from 'lucide-react';
import SankeyMiniChart from './SankeyMiniChart';
import { Navbar } from './Navbar';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mount flag to trigger entrance animations on first paint
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Sections that control the right-side preview
  const sections = [
    {
      id: 'import',
      title: 'Import from Gmail in 30 seconds',
      description: 'Connect once. We scan subject lines to auto-create applications with dates and companies.',
      icon: Bell,
    },
    {
      id: 'organize',
      title: 'Organize everything in one dashboard',
      description: 'Statuses, notes, and dates at a glance. Search and update without losing context.',
      icon: Search,
    },
    {
      id: 'insights',
      title: 'See trends and act faster',
      description: 'Week-over-week charts and streaks keep you moving. Spot bottlenecks instantly.',
      icon: TrendingUp,
    },
  ];

  const [active, setActive] = React.useState(sections[0].id);
  const refs = React.useRef({});

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.getAttribute('data-id'));
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.25, 0.5, 0.75] }
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar />

      {/* Split hero with sticky preview (inspired by [leetr.io](https://www.leetr.io/)) */}
      <section className={`py-1.5 lg:py-4 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="container mx-auto px-3 lg:px-6 grid md:grid-cols-[1.15fr_1fr] gap-4 lg:gap-8 items-start">
          {/* Left: headline + CTA */}
                      <div className={`transition-all duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight text-black dark:text-white leading-tight ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}>
              From Apply to Accepted,
              <br />
              <GradientText>Track Your Job.</GradientText>
            </h1>
            <p className={`mt-3 text-[15px] text-muted-foreground max-w-lg ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-[1800ms] delay-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}>
              A smarter way to track applications with Gmail import, clean dashboards, and actionable analytics.
            </p>
            <div className={`mt-4 flex flex-col sm:flex-row gap-2 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-[1800ms] delay-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}>
              {user ? (
                <>
                  <Button size="lg" onClick={() => navigate('/dashboard')} className="px-5 py-3 text-sm">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/add')} className="px-5 py-3 text-sm">
                    Add Application
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/register')} className="px-5 py-3 text-sm">
                    Get Started<ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="px-5 py-3 text-sm">
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Scroll story: each section reveals and drives preview state */}
            <div className="mt-5 space-y-4">
              {sections.map((s, i) => (
                <div
                  key={s.id}
                  data-id={s.id}
                  ref={(el) => (refs.current[s.id] = el)}
                  style={{ transitionDelay: `${520 + i * 170}ms` }}
                  className={`transition-all duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    active === s.id ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'
                  } ${mounted ? '' : 'opacity-0 translate-y-4'}`}
                >
                  <div className="flex items-start gap-3">
                    <s.icon className="h-4 w-4 mt-1 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground max-w-prose">{s.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust row directly under the last feature like on leetr */}
            <div className={`mt-6 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-[1800ms] delay-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}>
              <div className="my-3 border-top-0 border-t border-border" />
              <div className="mb-3 text-xs text-muted-foreground">Trusted by students and job seekers</div>
              <div className="flex flex-wrap gap-2">
                <TrustPill icon={<UsersIcon className="h-4 w-4" />} text="1,000+ users" />
                <TrustPill icon={<ShieldCheck className="h-4 w-4" />} text="Privacy‑first" />
                <TrustPill icon={<MailCheck className="h-4 w-4" />} text="Read‑only Gmail access" />
                <TrustPill icon={<Lock className="h-4 w-4" />} text="Secure by design" />
                <TrustPill icon={<Github className="h-4 w-4" />} text="Open‑source core" />
                <TrustPill icon={<XCircle className="h-4 w-4" />} text="Not vibe coded" />
              </div>
            </div>
          </div>

          {/* Right: sticky preview – scaled down to fit */}
          <div className="relative hidden md:block">
            <div className="xl:sticky xl:top-3">
              <div className={`md:scale-[0.8] xl:scale-[0.85] origin-top-right drop-shadow-2xl transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${mounted ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-5 blur-[3px]'} delay-[900ms]`}>
                <DashboardPreview active={active} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust row moved inside hero (above). Keeping section removed to avoid duplication */}

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-black dark:text-white">Applycation</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:underline">Privacy</a>
              <a href="/terms" className="text-muted-foreground hover:underline">Terms</a>
              <a href="/contact" className="text-muted-foreground hover:underline">Contact</a>
            </nav>
            <p className="text-muted-foreground text-xs">© 2024 Applycation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview({ active }) {
  return (
    <div className="space-y-6">
      {/* Unified: Dashboard + Connect Gmail */}
      <MockWindow title="Dashboard" tag="Preview">
        <div className="space-y-4">
          {/* Gmail Import - Enhanced Design */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-200/20 bg-gradient-to-br from-emerald-50/50 to-blue-50/30 dark:from-emerald-950/30 dark:to-blue-950/20 dark:border-emerald-800/30">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
            
            <div className="relative p-6">
              {/* Header with Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <MailCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Gmail Connected</span>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Ready to import applications</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden rounded-lg border border-emerald-200/40 bg-white/60 dark:bg-gray-800/60 dark:border-emerald-700/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Last Scan</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">2 min ago</div>
                    <button className="mt-3 w-full text-xs px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                      Scan Now
                    </button>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden rounded-lg border border-emerald-200/40 bg-white/60 dark:bg-gray-800/60 dark:border-emerald-700/40 backdrop-blur-sm">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-purple-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Detected</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">23</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+5 this week</div>
                  </div>
                </div>
              </div>

              {/* Quick Action */}
              <div className="mt-4 p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 border border-emerald-200/30 dark:border-emerald-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">Import Status</span>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                    Open Import Page
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-emerald-500/10 p-3">
              <div className="text-xs text-emerald-300">Applied</div>
              <div className="text-2xl font-semibold text-emerald-200">42</div>
            </div>
            <div className="rounded-lg border border-border bg-amber-500/10 p-3">
              <div className="text-xs text-amber-300">Interview</div>
              <div className="text-2xl font-semibold text-amber-200">7</div>
            </div>
            <div className="rounded-lg border border-border bg-rose-500/10 p-3">
              <div className="text-xs text-rose-300">Rejected</div>
              <div className="text-2xl font-semibold text-rose-200">27</div>
            </div>
          </div>
          {/* Application row with Add button */}
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium truncate">Software Engineer Intern – Google</div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-3 py-1 rounded-md border border-border hover:bg-muted/30">Add</button>
                <span className="text-xs rounded-full bg-emerald-600/15 text-emerald-500 px-2 py-0.5">Applied</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Applied 2d ago • SF, CA</div>
          </div>
        </div>
      </MockWindow>

      {/* Mini Analytics */}
      <MockWindow title="Analytics" tag="Preview">
        <div className="space-y-2">
          <div className="rounded-md border p-2">
            <SankeyMiniChart />
            <div className="mt-2 text-xs text-muted-foreground">Application status flow</div>
          </div>
          <div className="rounded-md border p-2">
            <HeatmapMini fullWidth={true} compact={true} />
            <div className="mt-1 text-[10px] text-muted-foreground">Daily activity (last months)</div>
          </div>
        </div>
      </MockWindow>

      {/* Import preview merged into Dashboard */}
    </div>
  );
}

function TrustPill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-4 py-2 text-sm text-foreground border border-border">
      {icon}
      <span>{text}</span>
    </div>
  );
}

// Gradient helper used in headline
function GradientText({ children }) {
  return (
    <span className="bg-gradient-to-r from-[#8ab4ff] via-[#c084fc] to-[#a78bfa] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

// Mock window chromes like the leetr card (rounded frame + dots and title)
function MockWindow({ title = '', tag, height, children }) {
  return (
    <div className="rounded-2xl border border-border bg-background shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-muted-foreground">{title}</span>
        </div>
        {tag && (
          <span className="text-xs bg-muted/40 px-2 py-0.5 rounded-full">{tag}</span>
        )}
      </div>
      <div className="p-3 lg:p-4">{children}</div>
    </div>
  );
}

// Minimal heatmap grid preview
function HeatmapMini({ fullWidth = false, compact = false }) {
  const cols = 28; const rows = 7;
  const cells = Array.from({ length: rows * cols });
  const monthAbbr = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'];
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Month labels (approx every 4 cols) */}
      <div className={`flex text-muted-foreground mb-1 ml-6 ${compact ? '' : ''}`} style={{ fontSize: compact ? '8px' : '9px', gap: compact ? 12 : 14 }}>
        {monthAbbr.map((m, i) => (
          <span key={m+i} style={{ width: compact ? 26 : 28 }}>{m}</span>
        ))}
      </div>
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-2 text-muted-foreground" style={{ fontSize: compact ? '8px' : '9px' }}>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(${compact ? 7 : 8}px, 1fr))`, gap: `${compact ? 3 : 4}px` }}>
          {cells.map((_, i) => {
            const intensity = (i * 37) % 5; // pseudo-random
            const shades = ['#1f2937', '#10b98122', '#10b98155', '#10b98188', '#10b981cc'];
            return <div key={i} className={compact ? 'h-[7px] rounded-[2px]' : 'h-[8px] rounded-[2px]'} style={{ background: shades[intensity] }} />;
          })}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-1 text-muted-foreground" style={{ fontSize: compact ? '9px' : '10px' }}>
        <span>Less</span>
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-sm bg-[#1f2937]" />
          <span className="h-2 w-2 rounded-sm bg-[#10b98122]" />
          <span className="h-2 w-2 rounded-sm bg-[#10b98155]" />
          <span className="h-2 w-2 rounded-sm bg-[#10b98188]" />
          <span className="h-2 w-2 rounded-sm bg-[#10b981cc]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}