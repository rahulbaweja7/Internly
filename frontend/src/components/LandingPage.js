import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, BarChart3, Trello } from 'lucide-react';
import { Navbar } from './Navbar';

const COMPANIES = [
  'Google','Meta','Apple','Amazon','Microsoft','Stripe','OpenAI','Databricks',
  'Figma','Notion','Vercel','Airbnb','Spotify','Netflix','Shopify','Anthropic',
  'Twilio','Cloudflare','Uber','LinkedIn',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">

        {/* Left */}
        <div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
            Every app.
            <br />
            <span className="text-gray-300 dark:text-gray-600">One board.</span>
          </h1>

          <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
            Applycation imports from Gmail and turns your job hunt into a Kanban board.
            See exactly where you stand with every company.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {user ? 'Go to Dashboard' : 'Start for free'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">7</div>
              <div className="text-xs text-gray-400 mt-0.5">pipeline stages</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">30s</div>
              <div className="text-xs text-gray-400 mt-0.5">Gmail import</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">$0</div>
              <div className="text-xs text-gray-400 mt-0.5">forever free</div>
            </div>
          </div>
        </div>

        {/* Right — Kanban mock */}
        <div className="relative hidden lg:block">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-xl">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">Applycation — Dashboard</span>
            </div>
            {/* Board */}
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
              <KanbanColMock label="Interview" dot="bg-amber-500" count={2} cards={[
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
          {/* Floating status card */}
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">OpenAI offer!</p>
              <p className="text-[11px] text-gray-400">Moved to Accepted</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────── */}
      <div className="mt-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 py-3.5 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'marquee 32s linear infinite' }}>
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <span key={i} className="text-[12px] text-gray-300 dark:text-gray-600 font-medium shrink-0">{c}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-24">

        <FeatureRow
          tag="Gmail import"
          icon={<Mail className="h-4 w-4" />}
          headline="Your inbox already has the data."
          body="Connect Gmail once. We scan subject lines for application emails and build your tracker automatically — company, role, date, all filled in. No copy-pasting."
          visual={<GmailMock />}
        />

        <FeatureRow
          tag="Kanban board"
          icon={<Trello className="h-4 w-4" />}
          headline="Drag it to where it actually is."
          body="Applied, OA, Phone Screen, Technical, Final, Accepted, Rejected — seven stages that map to reality. Drag a card and the status saves instantly."
          visual={<BoardMock />}
          flip
        />

        <FeatureRow
          tag="Analytics"
          icon={<BarChart3 className="h-4 w-4" />}
          headline="See where your funnel leaks."
          body="Response rate, interview conversion, weekly pace. Charts that show where applications go quiet so you can fix it before the semester ends."
          visual={<AnalyticsMock />}
        />
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 px-10 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Ready to stop losing track?</h2>
            <p className="mt-1.5 text-gray-400 text-sm">Takes two minutes. Works with your existing Gmail.</p>
          </div>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            className="shrink-0 group flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            {user ? 'Open Dashboard' : 'Create free account'}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-500">Applycation</span>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FeatureRow({ tag, icon, headline, body, visual, flip = false }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${flip ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4">
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
    <div className="p-4">
      <div className="flex gap-2">
        {[
          { label: 'Applied', dot: 'bg-blue-500', n: '362' },
          { label: 'OA', dot: 'bg-violet-500', n: '200' },
          { label: 'Interview', dot: 'bg-amber-500', n: '7' },
        ].map(col => (
          <div key={col.label} className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{col.label}</span>
              <span className="ml-auto text-[9px] font-bold text-gray-400">{col.n}</span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-2 gap-1.5">
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
          <span key={m} className="text-[8px] text-gray-300 dark:text-gray-600 flex-1 text-center">{m}</span>
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
