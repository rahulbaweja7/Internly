import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Briefcase, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export function InternshipForm({ internship, onSubmit, onCancel, onDelete, onDeleteEmail }) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    status: 'Applied',
    appliedDate: '',
    description: '',
    salary: '',
    notes: '',
    jobUrl: '',
    currency: 'USD',
    period: 'month',
    amount: ''
  });
  const [showConfetti, setShowConfetti] = useState(false);

  const requiredKeys = ['company', 'position', 'location', 'status', 'appliedDate', 'description'];
  const progress = useMemo(() => requiredKeys.filter(k => String(formData[k] || '').trim().length > 0).length, [formData, requiredKeys]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('add-internship-form');
        if (form) form.requestSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (internship) {
      console.log('Internship data in form:', internship);
      console.log('Has emailId:', !!internship.emailId);
      setFormData({
        company: internship.company,
        position: internship.position,
        location: internship.location,
        status: internship.status,
        appliedDate: internship.appliedDate,
        description: internship.description,
        salary: internship.salary || '',
        notes: internship.notes || '',
        jobUrl: internship.jobUrl || '',
        currency: 'USD',
        period: 'month',
        amount: ''
      });
    } else {
      // Reset form for new internship
      setFormData({
        company: '',
        position: '',
        location: '',
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        description: '',
        salary: '',
        notes: '',
        jobUrl: '',
        currency: 'USD',
        period: 'month',
        amount: ''
      });
    }
  }, [internship]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position) {
      alert('Please fill in company and position fields');
      return;
    }

    const payload = { ...formData };
    if (formData.amount) {
      payload.salary = `${formData.currency === 'USD' ? '$' : ''}${formData.amount}/${formData.period}`;
    }
    if (internship) {
      onSubmit({ ...internship, ...payload });
    } else {
      onSubmit(payload);
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1800);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Quick helpers data
  const companySuggestions = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Stripe', 'OpenAI', 'Databricks'];
  const citySuggestions = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'];
  const statuses = ['Applied', 'Online Assessment', 'Interview', 'Accepted', 'Rejected'];

  const streakDays = (() => {
    try { return Number(localStorage.getItem('streakDays')) || 0; } catch (_) { return 0; }
  })();

  const setDateQuick = (preset) => {
    const d = new Date();
    if (preset === 'yesterday') d.setDate(d.getDate() - 1);
    if (preset === 'lastweek') d.setDate(d.getDate() - 7);
    handleChange('appliedDate', d.toISOString().split('T')[0]);
  };

  const handleUrlBlur = () => {
    if (!formData.jobUrl) return;
    try {
      const u = new URL(formData.jobUrl);
      const domain = u.hostname.replace('www.', '');
      if (!formData.company) handleChange('company', domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1));
      const path = decodeURIComponent(u.pathname.replace(/[-/]+/g, ' ')).trim();
      if (path && !formData.position) handleChange('position', path.replace(/\d+/g, '').trim());
    } catch (_) {
      // ignore
    }
  };

  return (
    <>
    <form id="add-internship-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Header glass card */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-border">
              <Briefcase className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{internship ? 'Edit Job' : 'Add Job'}</h3>
              <p className="text-sm text-muted-foreground">Keep it short and clear — you can edit later.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> {progress}/6 complete • Streak: {streakDays}d
          </span>
        </div>
        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-10">
          {/* Left form */}
          <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                list="company-suggest"
                placeholder="e.g., Google — clear, capitalized"
                required
                className="transition-transform focus:scale-[1.01]"
              />
              <datalist id="company-suggest">
                {companySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">Tip: Use the official company name.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="e.g., Software Engineering Intern (Summer 2026)"
                required
                className="transition-transform focus:scale-[1.01]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                list="city-suggest"
                placeholder="e.g., San Francisco, CA"
                className="transition-transform focus:scale-[1.01]"
              />
              <datalist id="city-suggest">
                {citySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleChange('status', s)}
                    className={`px-3 py-1.5 rounded-full text-xs ring-1 ring-border transition ${formData.status === s ? 'bg-white/10 ring-white/30' : 'hover:bg-white/5'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="appliedDate">Application Date</Label>
              <Input
                id="appliedDate"
                type="date"
                value={formData.appliedDate}
                onChange={(e) => handleChange('appliedDate', e.target.value)}
              />
              <div className="flex gap-3 text-xs">
                <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('today')}>Today</button>
                <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('yesterday')}>Yesterday</button>
                <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('lastweek')}>Last week</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Salary (Optional)</Label>
              <div className="grid grid-cols-5 gap-2">
                <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                  <SelectTrigger className="col-span-1"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="8000" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} className="col-span-2" />
                <Select value={formData.period} onValueChange={(v) => handleChange('period', v)}>
                  <SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">/ hour</SelectItem>
                    <SelectItem value="month">/ month</SelectItem>
                    <SelectItem value="year">/ year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <Label htmlFor="jobUrl">Job URL (Optional)</Label>
            <div className="flex gap-2">
              <Input id="jobUrl" value={formData.jobUrl} onChange={(e) => handleChange('jobUrl', e.target.value)} onBlur={handleUrlBlur} placeholder="Paste job listing link…" className="flex-1" />
              <Button type="button" variant="outline" onClick={handleUrlBlur} title="Try auto-fill"><LinkIcon className="h-4 w-4"/></Button>
            </div>
            <p className="text-xs text-muted-foreground">We’ll try to infer company and title from the link.</p>
          </div>

          <div className="space-y-2 mt-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the internship role and responsibilities..."
              rows={2}
            />
          </div>

          <div className="space-y-2 mt-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes, interview feedback, etc..."
              rows={2}
            />
          </div>
          </div>

          {/* Preview removed for compact single-column layout */}
        </div>
      </div>

      <div className="flex gap-2 pt-3">
            {internship && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={onDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {internship ? 'Update Job' : 'Add Job'}
            </Button>
            {internship && internship.emailId && onDeleteEmail && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onDeleteEmail(internship.emailId)}
                className="flex items-center gap-2"
                title="Delete email from Gmail"
              >
                <Trash2 className="h-4 w-4" />
                Delete Email
              </Button>
            )}
          </div>
        </form>
      {/* Sticky action bar */}
      <div className="fixed bottom-4 inset-x-0 px-6 pointer-events-none">
        <div className="mx-auto max-w-3xl rounded-full border border-border/80 bg-background/70 backdrop-blur shadow-lg flex items-center justify-between p-2 pointer-events-auto">
          <span className="text-xs text-muted-foreground ml-3">Cmd/Ctrl + Enter to {internship ? 'update' : 'add'} • Stored privately</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => { const f=document.getElementById('add-internship-form'); if (f) f.requestSubmit(); }}>{internship ? 'Update Internship' : 'Add Internship'}</Button>
          </div>
        </div>
      </div>

      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} className="absolute animate-[fall_1.6s_ease-in_forwards]" style={{ left: `${Math.random()*100}%`, top: '-10px', color: ['#60a5fa','#34d399','#f472b6','#fbbf24'][i%4] }}>•</span>
          ))}
          <style>{`@keyframes fall {to {transform: translateY(120vh) rotate(360deg); opacity: 0;}}`}</style>
        </div>
      )}
    </>
  );
} 