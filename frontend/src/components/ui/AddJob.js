import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Navbar } from '../Navbar';
import axios from 'axios';
import config from '../../config/config';
import { Briefcase, CheckCircle2, Link as LinkIcon } from 'lucide-react';

function AddJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
  const [showConfetti, setShowConfetti] = useState(false);

  const requiredKeys = ['company', 'position', 'location', 'appliedDate', 'status', 'description'];
  const progress = useMemo(() => requiredKeys.filter(k => String(formData[k] || '').trim().length > 0).length, [formData]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('add-job-form');
        if (form) form.requestSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position || !formData.location || !formData.appliedDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Ensure CSRF cookie exists; if missing, perform a safe GET to prime it
      const hasCsrf = /(?:^|; )csrf=([^;]+)/.test(document.cookie || '');
      if (!hasCsrf) {
        try {
          await axios.get(`${config.API_BASE_URL}/healthz`, { withCredentials: true });
        } catch (_) {
          // ignore health check failures; verifyCsrf will still guard POST
        }
      }

      const csrf = (document.cookie.match(/(?:^|; )csrf=([^;]+)/) || [])[1] || '';
      const salary = formData.amount ? `${formData.currency === 'USD' ? '$' : ''}${formData.amount}/${formData.period}` : formData.salary;
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company: formData.company,
        role: formData.position,
        location: formData.location,
        status: formData.status,
        stipend: salary,
        dateApplied: formData.appliedDate,
        notes: formData.notes
      }, {
        withCredentials: true,
        headers: csrf ? { 'X-CSRF-Token': csrf } : {}
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1600);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding job:", error);
      alert("Failed to add internship");
    }
  };

  const companySuggestions = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Stripe', 'OpenAI', 'Databricks'];
  const citySuggestions = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'];
  const statuses = ['Applied', 'Online Assessment', 'Interview', 'Accepted', 'Rejected'];

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
      if (!formData.company) handleChange('company', domain.split('.')[0].replace(/^./, m => m.toUpperCase()));
      const path = decodeURIComponent(u.pathname.replace(/[\/-]+/g, ' ')).trim();
      if (path && !formData.position) handleChange('position', path.replace(/\d+/g, '').trim());
    } catch (_) {}
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto p-6 max-w-6xl pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-border">
              <Briefcase className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Add New Job</h1>
              <p className="text-muted-foreground">Fill out details to track your application</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs rounded-full border border-border px-2 py-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> {progress}/6 complete</span>
        </div>

        <div>
          <Card className="rounded-2xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
            <form id="add-job-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="e.g., Google — official name"
                    list="company-suggest"
                    required
                  />
                  <datalist id="company-suggest">
                    {companySuggestions.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="e.g., Software Engineering Intern (Summer 2026)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    list="city-suggest"
                    required
                  />
                  <datalist id="city-suggest">
                    {citySuggestions.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(s => (
                      <button key={s} type="button" className={`px-3 py-1.5 rounded-full text-xs ring-1 ring-border transition ${formData.status === s ? 'bg-white/10 ring-white/30' : 'hover:bg-white/5'}`} onClick={() => handleChange('status', s)}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appliedDate">Application Date *</Label>
                  <Input
                    id="appliedDate"
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => handleChange('appliedDate', e.target.value)}
                    required
                  />
                  <div className="flex gap-2 text-xs">
                    <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('today')}>Today</button>
                    <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('yesterday')}>Yesterday</button>
                    <button type="button" className="px-2 py-1 rounded-md border border-border hover:bg-white/5" onClick={() => setDateQuick('lastweek')}>Last week</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (Optional)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input id="jobUrl" value={formData.jobUrl} onChange={(e) => handleChange('jobUrl', e.target.value)} onBlur={handleUrlBlur} placeholder="Paste job listing link…" className="flex-1" />
                  <Button type="button" variant="outline" onClick={handleUrlBlur} title="Try auto-fill"><LinkIcon className="h-4 w-4"/></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the internship role and responsibilities..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes, interview feedback, etc..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Add Job</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
      {/* Removed sticky hint bar */}

      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} className="absolute animate-[fall_1.6s_ease-in_forwards]" style={{ left: `${Math.random()*100}%`, top: '-10px', color: ['#60a5fa','#34d399','#f472b6','#fbbf24'][i%4] }}>•</span>
          ))}
          <style>{`@keyframes fall {to {transform: translateY(120vh) rotate(360deg); opacity: 0;}}`}</style>
        </div>
      )}
    </div>
  );
}

export default AddJob; 