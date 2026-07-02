import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, BarChart3, Trello, CheckCircle } from 'lucide-react';
import { Navbar } from './Navbar';

// Wraps children and fades/slides them up when they enter the viewport.
function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(18px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// A full-viewport section that acts as a scroll-snap target.
function Page({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen flex flex-col justify-center border-t border-gray-100 dark:border-gray-800 ${className}`}
      style={{ scrollSnapAlign: 'start' }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Enable page-by-page scroll snap while on the landing page.
  useEffect(() => {
    const html = document.documentElement;
    html.style.scrollSnapType = 'y mandatory';
    html.style.scrollPaddingTop = '57px'; // matches sticky navbar height
    return () => {
      html.style.scrollSnapType = '';
      html.style.scrollPaddingTop = '';
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />

      <main>

        {/* ── Page 1: Hero ──────────────────────────────────────────── */}
        <Page className="border-t-0">
          <section className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center w-full">
            <FadeIn>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                Stop tracking
                <br />
                in&nbsp;spreadsheets.
              </h1>

              <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                Connect Gmail once. Every application email you've ever sent — company, role, status — pulled in automatically and laid out on a Kanban board.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {user ? 'Go to Dashboard' : 'Start for free'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                {!user && (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['R','J','S','A','M'].map((l, i) => (
                    <div key={i} className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-950 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">300+ students have their whole pipeline here</p>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">3k+</div>
                  <div className="text-xs text-gray-400 mt-0.5">apps tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">30s</div>
                  <div className="text-xs text-gray-400 mt-0.5">to set up</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">$0</div>
                  <div className="text-xs text-gray-400 mt-0.5">forever free</div>
                </div>
              </div>
            </FadeIn>

            {/* Kanban mock */}
            <FadeIn delay={120}>
              <div className="relative hidden lg:block">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-xl">
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs text-gray-400">Applycation — Dashboard</span>
                  </div>
                  <div className="p-4 flex gap-2 overflow-hidden">
                    <KanbanColMock label="Applied" dot="bg-blue-500" count={8} cards={[
                      { role: 'Software Engineer', co: 'Google' },
                      { role: 'SWE Intern', co: 'Meta' },
                      { role: 'Backend Intern', co: 'Stripe' },
                    ]} />
                    <KanbanColMock label="OA" dot="bg-violet-500" count={3} cards={[
                      { role: 'SWE Intern', co: 'Amazon' },
                      { role: 'Frontend Dev', co: 'Figma' },
                    ]} />
                    <KanbanColMock label="Phone Screen" dot="bg-amber-500" count={2} cards={[
                      { role: 'iOS Intern', co: 'Apple' },
                    ]} active />
                    <KanbanColMock label="Accepted" dot="bg-emerald-500" count={1} cards={[
                      { role: 'SWE Intern', co: 'OpenAI', accepted: true },
                    ]} />
                    <KanbanColMock label="Rejected" dot="bg-red-400" count={4} cards={[
                      { role: 'PM Intern', co: 'Netflix' },
                    ]} />
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">OpenAI offer!</p>
                    <p className="text-[11px] text-gray-400">Moved to Accepted</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 2: How it works ──────────────────────────────────── */}
        <Page>
          <section className="max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No setup. No spreadsheet.</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Connect Gmail. We do the rest.</p>
              </div>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-4 left-[38%] right-[38%] h-px bg-gray-100 dark:bg-gray-800" />
              {[
                {
                  n: '01',
                  title: 'Connect Gmail in 30 seconds',
                  body: 'Read-only OAuth. We scan subject lines — we never read email bodies or store anything.',
                  delay: 0,
                },
                {
                  n: '02',
                  title: 'Every application, found',
                  body: 'Greenhouse, Lever, LinkedIn, Indeed, direct — we parse company, role, date, and current status.',
                  delay: 100,
                },
                {
                  n: '03',
                  title: 'Drag to update, done',
                  body: 'Nine pipeline stages. Move a card when your status changes. Your whole hunt in one view.',
                  delay: 200,
                },
              ].map(step => (
                <FadeIn key={step.n} delay={step.delay}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-300 dark:text-gray-600 tracking-widest">{step.n}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        </Page>

        {/* ── Page 3: Gmail feature ─────────────────────────────────── */}
        <Page>
          <section className="max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                tag="Gmail import"
                icon={<Mail className="h-3.5 w-3.5" />}
                headline="Your inbox already has the data."
                body="Connect Gmail once. We scan subject lines for application emails and build your tracker automatically — company, role, date, all filled in. No copy-pasting."
                visual={<GmailMock />}
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 4: Kanban feature ────────────────────────────────── */}
        <Page>
          <section className="max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                tag="Kanban board"
                icon={<Trello className="h-3.5 w-3.5" />}
                headline="Drag it to where it actually is."
                body="Applied, OA, Phone Screen, Technical, Final, Accepted, Rejected — nine stages that map to reality. Drag a card and the status saves instantly."
                visual={<BoardMock />}
                flip
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 5: Analytics feature ─────────────────────────────── */}
        <Page>
          <section className="max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                tag="Analytics"
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                headline="See where your funnel leaks."
                body="Response rate, interview conversion, weekly pace. Charts that show where applications go quiet so you can fix it before the semester ends."
                visual={<AnalyticsMock />}
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 6: CTA + Footer ──────────────────────────────────── */}
        <Page>
          <section className="max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 px-10 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Start tracking for free.</h2>
                  <p className="mt-1.5 text-gray-400 text-sm">Connect Gmail in 30 seconds. No manual entry, ever.</p>
                </div>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="shrink-0 group flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {user ? 'Open Dashboard' : 'Create free account'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </FadeIn>
          </section>
          <footer className="border-t border-gray-100 dark:border-gray-800 px-6 py-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Applycation</span>
                <p className="text-xs text-gray-400 mt-0.5">Your job hunt, organised.</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-400">
                {user && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer font-medium"
                  >
                    Dashboard <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                <a href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</a>
              </div>
            </div>
          </footer>
        </Page>

      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FeatureRow({ tag, icon, headline, body, visual, flip = false }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4 bg-blue-50 dark:bg-blue-950/60 rounded-full px-3 py-1">
          {icon}
          {tag}
        </div>
        <h2 className="text-3xl font-bold tracking-tight leading-tight text-gray-900 dark:text-white">{headline}</h2>
        <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-gray-50 dark:bg-gray-900">
        {visual}
      </div>
    </div>
  );
}

function KanbanColMock({ label, dot, count, cards, active = false }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate">{label}</span>
        <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1">{count}</span>
      </div>
      <div className={`rounded-lg border-2 border-dashed p-1.5 space-y-1.5 min-h-[140px] ${active ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20' : 'border-gray-100 dark:border-gray-800'}`}>
        {cards.map((c, i) => (
          <div key={i} className={`rounded-md border p-1.5 text-[9px] ${c.accepted ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
            <p className="font-semibold text-gray-700 dark:text-gray-300 truncate leading-tight">{c.role}</p>
            <p className="text-gray-400 truncate">{c.co}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GmailMock() {
  const emails = [
    { from: 'Google Recruiting', sub: 'Your application to Software Engineer', tag: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { from: 'Meta Careers', sub: 'We received your application', tag: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { from: 'Stripe', sub: 'Next steps: Online Assessment', tag: 'OA', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
    { from: 'Apple HR', sub: 'Interview invitation — iOS Intern', tag: 'Interview', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  ];
  return (
    <div className="p-4 space-y-2">
      <p className="text-[11px] font-medium text-gray-400 mb-3">Detected in your inbox</p>
      {emails.map((e, i) => (
        <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-gray-500">{e.from[0]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{e.from}</p>
            <p className="text-[9px] text-gray-400 truncate">{e.sub}</p>
          </div>
          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${e.color}`}>{e.tag}</span>
        </div>
      ))}
    </div>
  );
}

function BoardMock() {
  return (
    <div className="relative overflow-hidden select-none" style={{ minHeight: 178 }}>
      <style>{`
        @keyframes bm-cursor {
          0%,10%   { left:50%; top:80px;  opacity:0; }
          13%      { left:50%; top:80px;  opacity:1; }
          21%      { left:50%; top:96px;  opacity:1; }
          26%      { left:50%; top:92px;  opacity:1; }
          52%      { left:82%; top:80px;  opacity:1; }
          56%      { left:82%; top:84px;  opacity:1; }
          63%      { left:85%; top:64px;  opacity:1; }
          70%,100% { left:85%; top:64px;  opacity:0; }
        }
        @keyframes bm-drag {
          0%,24%   { left:34%; top:86px;  opacity:0; transform:rotate(0deg) scale(1);    box-shadow:none; }
          28%      { left:34%; top:82px;  opacity:1; transform:rotate(2deg) scale(1.07); box-shadow:0 8px 24px rgba(0,0,0,.22); }
          52%      { left:66%; top:74px;  opacity:1; transform:rotate(2deg) scale(1.07); box-shadow:0 8px 24px rgba(0,0,0,.22); }
          57%      { left:66%; top:78px;  opacity:1; transform:rotate(0deg) scale(1);    box-shadow:none; }
          65%      { left:66%; top:78px;  opacity:0; }
          100%     { left:66%; top:78px;  opacity:0; }
        }
        @keyframes bm-ghost {
          0%,26%   { opacity:0; }
          30%,87%  { opacity:1; }
          93%,100% { opacity:0; }
        }
        @keyframes bm-recv {
          0%,57%   { opacity:0; transform:translateY(5px); }
          62%,87%  { opacity:1; transform:translateY(0);   }
          93%,100% { opacity:0; transform:translateY(0);   }
        }
        .bm-cursor { animation:bm-cursor 9s ease-in-out infinite; }
        .bm-drag   { animation:bm-drag   9s ease-in-out infinite; }
        .bm-ghost  { animation:bm-ghost  9s ease-in-out infinite; }
        .bm-recv   { animation:bm-recv   9s ease-in-out infinite; }
      `}</style>

      {/* Board columns */}
      <div className="p-4 flex gap-2.5">

        {/* Applied */}
        <div className="flex-1 min-w-0">
          <BoardColHeader label="Applied" dot="bg-blue-500" n={8} />
          <div className="space-y-1.5">
            <BoardCard role="SWE Intern" co="Google" />
            <BoardCard role="Software Engineer" co="Stripe" />
            <BoardCard role="iOS Intern" co="Apple" />
          </div>
        </div>

        {/* OA — ghost overlay animates over Amazon card during drag */}
        <div className="flex-1 min-w-0">
          <BoardColHeader label="OA" dot="bg-violet-500" n={3} />
          <div className="space-y-1.5">
            <BoardCard role="Frontend Dev" co="Figma" />
            <div className="relative">
              <BoardCard role="SWE Intern" co="Amazon" />
              <div
                className="bm-ghost absolute inset-0 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                style={{ opacity: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Offer — card appears here after drop */}
        <div className="flex-1 min-w-0">
          <BoardColHeader label="Interview" dot="bg-amber-500" n={2} />
          <div className="space-y-1.5">
            <BoardCard role="PM Intern" co="Meta" />
            <div className="bm-recv" style={{ opacity: 0 }}>
              <BoardCard role="SWE Intern" co="Amazon" />
            </div>
          </div>
        </div>

      </div>

      {/* Animated mouse cursor */}
      <div
        className="bm-cursor absolute pointer-events-none z-20"
        style={{ top: 0, left: 0, opacity: 0 }}
      >
        <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
          <path
            d="M1.5 1.5L1.5 12.8L4.4 9.2L6.3 14.2L8 13.5L6.1 8.8L10.5 8.8Z"
            fill="white"
            stroke="#111827"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Floating card that follows cursor during drag */}
      <div
        className="bm-drag absolute pointer-events-none z-10"
        style={{ top: 0, left: 0, opacity: 0, width: 90 }}
      >
        <div className="rounded-md border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 p-1.5">
          <p className="text-[9px] font-semibold text-gray-800 dark:text-gray-200 leading-tight">SWE Intern</p>
          <p className="text-[9px] text-gray-400">Amazon</p>
        </div>
      </div>

      <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-300 dark:text-gray-600">
        drag cards between stages
      </p>
    </div>
  );
}

function BoardColHeader({ label, dot, n }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5">{n}</span>
    </div>
  );
}

function BoardCard({ role, co }) {
  return (
    <div className="rounded-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5">
      <p className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 leading-tight truncate">{role}</p>
      <p className="text-[9px] text-gray-400 truncate">{co}</p>
    </div>
  );
}

function AnalyticsMock() {
  const bars = [18, 32, 24, 45, 38, 52, 41, 60, 48, 55, 62, 47];
  const max = Math.max(...bars);
  const BAR_MAX_PX = 80;
  return (
    <div className="p-5">
      <p className="text-[11px] font-medium text-gray-400 mb-4">Applications this year</p>
      <div className="flex items-end gap-1.5" style={{ height: BAR_MAX_PX }}>
        {bars.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
            style={{ height: Math.max(4, Math.round((v / max) * BAR_MAX_PX)) }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'].map(m => (
          <span key={m} className="text-[8px] text-gray-400 dark:text-gray-500 flex-1 text-center">{m}</span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Response rate', val: '34%', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Interviews', val: '21%', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'This week', val: '+12', color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-2.5">
            <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
