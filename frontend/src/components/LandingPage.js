import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, LayoutGrid, CheckCircle } from 'lucide-react';
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
        <Page className="border-t-0 relative overflow-hidden">
          {/* Subtle dot grid — light mode only */}
          <div
            className="absolute inset-0 pointer-events-none dark:opacity-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
          />
          {/* Soft blue glow top-right */}
          <div className="absolute -top-48 -right-48 w-[540px] h-[540px] rounded-full bg-blue-50 dark:bg-blue-950/20 blur-3xl pointer-events-none" />
          <section className="relative max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center w-full">
            <FadeIn>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                Stop tracking
                <br />
                in&nbsp;spreadsheets.
              </h1>

              <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                Connect Gmail once. Every application email you've ever sent, company, role, and status, pulled in automatically and organized in one place.
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

            {/* Dashboard grid mock */}
            <FadeIn delay={120}>
              <div className="relative hidden lg:block">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-xl">
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs text-gray-400">Applycation · Dashboard</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2.5">
                    <GridCardMock role="Software Engineer" co="Google"  status="Applied"    statusColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" />
                    <GridCardMock role="SWE Intern"         co="Meta"   status="Applied"    statusColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" />
                    <GridCardMock role="Backend Intern"     co="Stripe" status="OA"         statusColor="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30" />
                    <GridCardMock role="iOS Intern"         co="Apple"  status="Interview"  statusColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" />
                    <GridCardMock role="SWE Intern"         co="OpenAI" status="Accepted"   statusColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" />
                    <GridCardMock role="PM Intern"          co="Netflix" status="Rejected"  statusColor="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">OpenAI offer!</p>
                    <p className="text-[11px] text-gray-400">Status updated to Accepted</p>
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
              <p className="text-xs font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-3">How it works</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Three steps, then it runs itself.</h2>
            </FadeIn>

            <div className="mt-10 grid md:grid-cols-3 gap-5">

              {/* Step 1 */}
              <FadeIn delay={0}>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col h-full">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-5">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 tracking-widest">01</span>
                  <h3 className="mt-1 text-[15px] font-semibold text-gray-900 dark:text-white">Connect Gmail in 30 seconds</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                    Read-only OAuth. We scan subject lines only, never email bodies. Revoke anytime from Google.
                  </p>
                  <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[11px] font-black text-red-500">G</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Google OAuth</p>
                        <p className="text-[9px] text-gray-400">gmail.readonly · revoke anytime</p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full shrink-0">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Step 2 */}
              <FadeIn delay={80}>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col h-full">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center mb-5">
                    <CheckCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 tracking-widest">02</span>
                  <h3 className="mt-1 text-[15px] font-semibold text-gray-900 dark:text-white">Every application, found</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                    Greenhouse, Lever, LinkedIn, Indeed, direct. We parse company, role, date, and status automatically.
                  </p>
                  <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2.5 space-y-1.5">
                    {[
                      { co: 'Google', role: 'SWE Intern', tag: 'Applied', tc: 'text-blue-600 dark:text-blue-400', bc: 'bg-blue-50 dark:bg-blue-900/30' },
                      { co: 'Stripe', role: 'Backend Eng', tag: 'OA', tc: 'text-violet-600 dark:text-violet-400', bc: 'bg-violet-50 dark:bg-violet-900/30' },
                      { co: 'Apple', role: 'iOS Intern', tag: 'Interview', tc: 'text-amber-600 dark:text-amber-400', bc: 'bg-amber-50 dark:bg-amber-900/30' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-gray-600">
                        <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold text-gray-500 dark:text-gray-300">{r.co[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{r.co}</p>
                          <p className="text-[9px] text-gray-400 truncate">{r.role}</p>
                        </div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${r.tc} ${r.bc}`}>{r.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              {/* Step 3 */}
              <FadeIn delay={160}>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col h-full">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-5">
                    <LayoutGrid className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 tracking-widest">03</span>
                  <h3 className="mt-1 text-[15px] font-semibold text-gray-900 dark:text-white">Update status, done</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                    Nine pipeline stages. Change a card's status in one click. Your whole hunt in one view.
                  </p>
                  <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2.5 space-y-1.5">
                    {[
                      { co: 'Amazon', role: 'SWE Intern', tag: 'OA', tc: 'text-violet-600 dark:text-violet-400', bc: 'bg-violet-50 dark:bg-violet-900/30' },
                      { co: 'Apple', role: 'iOS Intern', tag: 'Interview', tc: 'text-amber-600 dark:text-amber-400', bc: 'bg-amber-50 dark:bg-amber-900/30' },
                      { co: 'OpenAI', role: 'SWE Intern', tag: 'Accepted', tc: 'text-emerald-600 dark:text-emerald-400', bc: 'bg-emerald-50 dark:bg-emerald-900/30' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-gray-600">
                        <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold text-gray-500 dark:text-gray-300">{r.co[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{r.co}</p>
                          <p className="text-[9px] text-gray-400 truncate">{r.role}</p>
                        </div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${r.tc} ${r.bc}`}>{r.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

            </div>
          </section>
        </Page>

        {/* ── Page 3: Gmail feature ─────────────────────────────────── */}
        <Page className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none dark:opacity-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
          <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-blue-50 dark:bg-blue-950/10 blur-3xl pointer-events-none" />
          <section className="relative max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                headline={<>Your inbox <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">already has the data.</span></>}
                body={
                  <div>
                    <p>Connect Gmail once. We scan subject lines for application emails and build your tracker automatically. Company, role, date, all filled in. No copy-pasting.</p>
                    <ul className="mt-5 space-y-3">
                      {[
                        'Works with Greenhouse, Lever, Workday, LinkedIn, Indeed, and direct emails',
                        'Read-only access. We never store email content, only metadata',
                        'Syncs automatically. New emails appear within seconds of arriving',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                visual={<GmailMock />}
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 4: Analytics feature ─────────────────────────────── */}
        <Page className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none dark:opacity-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
          <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-emerald-50 dark:bg-emerald-950/10 blur-3xl pointer-events-none" />
          <section className="relative max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                headline={<>See where <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">your funnel leaks.</span></>}
                body={
                  <div>
                    <p>Response rate, interview conversion, weekly pace. Charts that show where applications go quiet so you can fix it before the semester ends.</p>
                    <ul className="mt-5 space-y-3">
                      {[
                        'Response rate, interview conversion, and offer rate at a glance',
                        'Weekly application pace so you never fall behind',
                        'See exactly where in the funnel your applications stall',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                visual={<AnalyticsMock />}
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── CTA + Footer ───────────────────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-gray-800" style={{ scrollSnapAlign: 'start' }}>
          {/* CTA */}
          <div className="relative overflow-hidden bg-gray-950 py-24 px-6">
            {/* Decorative glows */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

            <FadeIn>
              <div className="relative max-w-2xl mx-auto text-center">
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                  Your next offer<br />
                  starts here.
                </h2>
                <p className="mt-5 text-gray-400 text-base leading-relaxed">
                  Connect Gmail in 30 seconds. Every application is tracked automatically.
                </p>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="mt-8 group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors cursor-pointer shadow-lg"
                >
                  {user ? 'Open Dashboard' : 'Create free account'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Footer */}
          <footer className="bg-gray-950 border-t border-white/5 px-6 py-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-500">Applycation</span>
              <div className="flex items-center gap-6 text-xs text-gray-600">
                {user && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1 hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    Dashboard <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
              </div>
            </div>
          </footer>
        </div>

      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FeatureRow({ tag, icon, headline, body, visual, flip = false }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        {tag && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4 bg-blue-50 dark:bg-blue-950/60 rounded-full px-3 py-1">
            {icon}
            {tag}
          </div>
        )}
        <h2 className="text-3xl font-bold tracking-tight leading-tight text-gray-900 dark:text-white">{headline}</h2>
        <div className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">{body}</div>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-gray-50 dark:bg-gray-900">
        {visual}
      </div>
    </div>
  );
}

function GridCardMock({ role, co, status, statusColor }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5">
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate leading-tight">{role}</p>
        <span className={`shrink-0 text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor}`}>{status}</span>
      </div>
      <p className="text-[9px] text-gray-400 truncate">{co}</p>
    </div>
  );
}

function GmailMock() {
  const emails = [
    { from: 'Google Recruiting', sub: 'Your application to Software Engineer', tag: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { from: 'Meta Careers', sub: 'We received your application', tag: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { from: 'Stripe', sub: 'Next steps: Online Assessment', tag: 'OA', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
    { from: 'Apple HR', sub: 'Interview invitation: iOS Intern', tag: 'Interview', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
    { from: 'Figma', sub: 'Application received: Frontend Engineer', tag: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { from: 'Amazon', sub: 'Action required: Complete your assessment', tag: 'OA', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  ];
  return (
    <div>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="ml-3 text-[11px] text-gray-400">Applycation · Gmail sync</span>
      </div>
      {/* Email rows */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Detected in your inbox</p>
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{emails.length} found</span>
        </div>
        {emails.map((e, i) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300">{e.from[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{e.from}</p>
              <p className="text-[9px] text-gray-400 truncate">{e.sub}</p>
            </div>
            <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${e.color}`}>{e.tag}</span>
          </div>
        ))}
      </div>
      {/* Stats footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center gap-3 bg-white dark:bg-gray-950/60">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Synced just now
        </span>
        <span className="text-gray-200 dark:text-gray-700">·</span>
        <span className="text-[10px] text-gray-400">read-only · no email content stored</span>
      </div>
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
