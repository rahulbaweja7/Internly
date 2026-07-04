import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, Trello, CheckCircle } from 'lucide-react';
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
                Connect Gmail once. Every application email you've ever sent, company, role, and status, pulled in automatically and laid out on a Kanban board.
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

            {/* Kanban mock */}
            <FadeIn delay={120}>
              <div className="relative hidden lg:block">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-xl">
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs text-gray-400">Applycation · Dashboard</span>
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
                    <Trello className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 tracking-widest">03</span>
                  <h3 className="mt-1 text-[15px] font-semibold text-gray-900 dark:text-white">Drag to update, done</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                    Nine pipeline stages. Move a card when your status changes. Your whole hunt in one view.
                  </p>
                  <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2.5 flex gap-2">
                    {[
                      { label: 'OA', dot: 'bg-violet-500', cards: [{ co: 'Amazon' }, { co: 'Figma' }] },
                      { label: 'Interview', dot: 'bg-amber-500', cards: [{ co: 'Apple' }, { co: 'Meta' }] },
                      { label: 'Offer', dot: 'bg-emerald-500', cards: [{ co: 'OpenAI', accent: true }] },
                    ].map((col, i) => (
                      <div key={i} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                          <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 truncate">{col.label}</span>
                        </div>
                        <div className="space-y-1">
                          {col.cards.map((c, j) => (
                            <div key={j} className={`rounded-md border px-2 py-1.5 ${c.accent ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                              <p className={`text-[9px] font-medium truncate ${c.accent ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>{c.co}</p>
                            </div>
                          ))}
                        </div>
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

        {/* ── Page 4: Kanban feature ────────────────────────────────── */}
        <Page className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none dark:opacity-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
          <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-violet-50 dark:bg-violet-950/10 blur-3xl pointer-events-none" />
          <section className="relative max-w-7xl mx-auto px-6 py-16 w-full">
            <FadeIn>
              <FeatureRow
                headline={<>Drag it to <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">where it actually is.</span></>}
                body={
                  <div>
                    <p>Applied, OA, Phone Screen, Technical, Final, Accepted, Rejected. Nine stages that map to reality. Drag a card and the status saves instantly.</p>
                    <ul className="mt-5 space-y-3">
                      {[
                        'Nine pipeline stages built for the real internship / new-grad process',
                        'Drag a card to update status. No forms, no friction',
                        'Every change syncs instantly across devices',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                visual={<BoardMock />}
                flip
              />
            </FadeIn>
          </section>
        </Page>

        {/* ── Page 5: Analytics feature ─────────────────────────────── */}
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
                  <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                    starts here.
                  </span>
                </h2>
                <p className="mt-5 text-gray-400 text-base leading-relaxed">
                  Connect Gmail in 30 seconds. Every application lands on your board automatically.
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

function BoardMock() {
  return (
    <div className="relative overflow-hidden select-none">
      <style>{`
        @keyframes bm-cursor {
          0%,10%   { left:50%; top:108px; opacity:0; }
          13%      { left:50%; top:108px; opacity:1; }
          21%      { left:50%; top:124px; opacity:1; }
          26%      { left:50%; top:120px; opacity:1; }
          52%      { left:82%; top:108px; opacity:1; }
          56%      { left:82%; top:112px; opacity:1; }
          63%      { left:85%; top:92px;  opacity:1; }
          70%,100% { left:85%; top:92px;  opacity:0; }
        }
        @keyframes bm-drag {
          0%,24%   { left:34%; top:114px; opacity:0; transform:rotate(0deg) scale(1);    box-shadow:none; }
          28%      { left:34%; top:110px; opacity:1; transform:rotate(2deg) scale(1.07); box-shadow:0 12px 32px rgba(0,0,0,.18); }
          52%      { left:66%; top:102px; opacity:1; transform:rotate(2deg) scale(1.07); box-shadow:0 12px 32px rgba(0,0,0,.18); }
          57%      { left:66%; top:106px; opacity:1; transform:rotate(0deg) scale(1);    box-shadow:none; }
          65%      { left:66%; top:106px; opacity:0; }
          100%     { left:66%; top:106px; opacity:0; }
        }
        @keyframes bm-ghost {
          0%,26%   { opacity:0; }
          30%,87%  { opacity:1; }
          93%,100% { opacity:0; }
        }
        @keyframes bm-recv {
          0%,57%   { opacity:0; transform:translateY(6px); }
          62%,87%  { opacity:1; transform:translateY(0);   }
          93%,100% { opacity:0; transform:translateY(0);   }
        }
        .bm-cursor { animation:bm-cursor 9s ease-in-out infinite; }
        .bm-drag   { animation:bm-drag   9s ease-in-out infinite; }
        .bm-ghost  { animation:bm-ghost  9s ease-in-out infinite; }
        .bm-recv   { animation:bm-recv   9s ease-in-out infinite; }
      `}</style>

      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <span className="h-2 w-2 rounded-full bg-red-400/80" />
        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2.5 text-[9px] font-medium text-gray-400 dark:text-gray-500">My Applications</span>
      </div>

      {/* Board columns */}
      <div className="p-3 flex gap-2 bg-gray-50 dark:bg-gray-900/60">

        {/* Applied */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-1 w-3 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied</span>
            <span className="ml-auto text-[8px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-full px-1.5 py-0.5">8</span>
          </div>
          <div className="space-y-1.5">
            <BoardCard role="SWE Intern"      co="Google" avatar="G" avatarColor="bg-blue-500" />
            <BoardCard role="Software Eng"    co="Stripe" avatar="S" avatarColor="bg-violet-500" />
            <BoardCard role="iOS Intern"      co="Apple"  avatar="A" avatarColor="bg-gray-700 dark:bg-gray-600" />
          </div>
        </div>

        {/* OA — ghost overlay animates over Amazon card during drag */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-1 w-3 rounded-full bg-violet-500" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">OA</span>
            <span className="ml-auto text-[8px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 rounded-full px-1.5 py-0.5">3</span>
          </div>
          <div className="space-y-1.5">
            <BoardCard role="Frontend Dev" co="Figma"  avatar="F" avatarColor="bg-purple-500" />
            <div className="relative">
              <BoardCard role="SWE Intern"  co="Amazon" avatar="A" avatarColor="bg-orange-500" />
              <div
                className="bm-ghost absolute inset-0 rounded-lg border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30"
                style={{ opacity: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Interview — received card appears here after drop */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-1 w-3 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interview</span>
            <span className="ml-auto text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full px-1.5 py-0.5">2</span>
          </div>
          <div className="space-y-1.5">
            <BoardCard role="PM Intern"  co="Meta"   avatar="M" avatarColor="bg-blue-600" />
            <div className="bm-recv" style={{ opacity: 0 }}>
              <BoardCard role="SWE Intern" co="Amazon" avatar="A" avatarColor="bg-orange-500" />
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
        style={{ top: 0, left: 0, opacity: 0, width: 96 }}
      >
        <div className="rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="h-4 w-4 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-bold text-white">A</span>
            </div>
            <p className="text-[8px] font-bold text-gray-700 dark:text-gray-300 truncate">Amazon</p>
          </div>
          <p className="text-[8px] text-gray-400 truncate">SWE Intern</p>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ role, co, avatar, avatarColor }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-2 shadow-sm">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className={`h-4 w-4 rounded-md ${avatarColor} flex items-center justify-center shrink-0`}>
          <span className="text-[7px] font-bold text-white">{avatar}</span>
        </div>
        <p className="text-[8px] font-bold text-gray-700 dark:text-gray-300 truncate">{co}</p>
      </div>
      <p className="text-[8px] text-gray-400 dark:text-gray-500 truncate pl-[22px]">{role}</p>
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
