import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Calendar, Building, MapPin, Trash2, CheckSquare, Square, X, Briefcase, ClipboardList, CheckCircle2, XCircle, TrendingUp, MailCheck, Plus, Kanban, BarChart2 } from 'lucide-react';
import { InternshipForm } from './InternshipForm';
import { Navbar } from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { JOB_STATUSES } from '../constants/jobStatuses';

export function InternshipDashboard() {
  const { jobs: internships, loading, addJob, deleteJob, deleteJobs, refresh, gmailConnected } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Removed unused urlSearchTerm state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  // Removed unused oauthMessage state
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Gentle entrance animation flag
  const [mounted, setMounted] = useState(false);
  const pageSize = 50;
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  // Removed unused auth destructuring to satisfy CI

  const firstName = (user?.name || user?.fullName || user?.email || '')
    .toString()
    .split(' ')[0]
    .split('@')[0];

  // Handle search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      // Handle search from navbar
      setSearchTerm(searchParam);
    } else {
      // If no search parameter, clear the search term
      setSearchTerm('');
    }
  }, [location.search]);

  // Reset to first page when filters/search/data change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, internships.length]);

  // Trigger entrance animations after first paint
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Removed unused handleApplicationsFound

  const filteredInternships = internships
    .filter(internship => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = internship.company.toLowerCase().includes(searchLower) ||
                           internship.role.toLowerCase().includes(searchLower) ||
                           internship.location.toLowerCase().includes(searchLower) ||
                           (internship.notes && internship.notes.toLowerCase().includes(searchLower)) ||
                           (internship.stipend && internship.stipend.toLowerCase().includes(searchLower));
      const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Primary: by application day (YYYY-MM-DD UTC) descending
      const toDayKey = (v) => {
        const d = new Date(v || 0);
        if (isNaN(d)) return '';
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const da = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      };
      const dayA = toDayKey(a.dateApplied || a.appliedDate || a.createdAt);
      const dayB = toDayKey(b.dateApplied || b.appliedDate || b.createdAt);
      if (dayA !== dayB) return dayB.localeCompare(dayA);

      // Secondary: within the same day, newest created first
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();
      if (createdA !== createdB) return createdB - createdA;

      // Tertiary: fallback to raw dateApplied time if present
      const tA = new Date(a.dateApplied || a.appliedDate || 0).getTime();
      const tB = new Date(b.dateApplied || b.appliedDate || 0).getTime();
      return tB - tA;
    }); // Sort by day, then createdAt so newest-added for that day appears first

  const totalPages = Math.max(1, Math.ceil(filteredInternships.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filteredInternships.slice(start, start + pageSize);

  const getStatusColor = (status) => {
    const styles = {
      'Applied':             'bg-blue-500/10 text-blue-300 ring-1 ring-blue-300/20',
      'Online Assessment':   'bg-violet-500/10 text-violet-300 ring-1 ring-violet-300/20',
      'Phone Interview':     'bg-amber-500/10 text-amber-300 ring-1 ring-amber-300/20',
      'Technical Interview': 'bg-orange-500/10 text-orange-300 ring-1 ring-orange-300/20',
      'Final Interview':     'bg-rose-500/10 text-rose-300 ring-1 ring-rose-300/20',
      'Accepted':            'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-300/20',
      'Rejected':            'bg-red-500/10 text-red-300 ring-1 ring-red-300/20',
      'Waitlisted':          'bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-300/20',
      'Withdrawn':           'bg-gray-500/10 text-gray-400 ring-1 ring-gray-400/20',
    };
    return styles[status] || 'bg-muted text-foreground/70 ring-1 ring-border/50';
  };

  const handleAddInternship = async (internshipData) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/jobs`, internshipData, {
        withCredentials: true
      });
      addJob(response.data);
      setIsFormOpen(false);
      toast.success('Job added');
    } catch (error) {
      toast.error('Failed to add job. Please try again.');
    }
  };

  const handleEditInternship = async (updatedInternship) => {
    try {
      await axios.put(`${config.API_BASE_URL}/api/jobs/${updatedInternship._id}`, {
        company: updatedInternship.company,
        role: updatedInternship.position,
        location: updatedInternship.location,
        status: updatedInternship.status,
        stipend: updatedInternship.salary,
        dateApplied: updatedInternship.appliedDate,
        interviewDate: updatedInternship.interviewDate || null,
        notes: updatedInternship.notes
      });
      setEditingInternship(null);
      setIsFormOpen(false);
      toast.success('Job updated');
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const handleDeleteInternship = async (id) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`);
      deleteJob(id);
      setSelectedJobs(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Job deleted');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const ids = Array.from(selectedJobs);
      await Promise.all(ids.map(id => axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`)));
      deleteJobs(ids);
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsBulkDeleteDialogOpen(false);
      toast.success(`Deleted ${ids.length} job${ids.length !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to delete some jobs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${config.API_BASE_URL}/api/jobs/delete-all`, { data: { confirm: 'delete-all' } });
      refresh();
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsDeleteAllDialogOpen(false);
      toast.success('All jobs deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete all jobs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/gmail/delete-email/${emailId}`);
      toast.success('Email deleted from Gmail');
    } catch (error) {
      toast.error('Failed to delete email from Gmail');
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const selectAllJobs = () => {
    const filteredIds = filteredInternships.map(job => job._id);
    setSelectedJobs(new Set(filteredIds));
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedJobs(new Set());
  };

  const statusCounts = internships.reduce((acc, internship) => {
    acc[internship.status] = (acc[internship.status] || 0) + 1;
    return acc;
  }, {});

  const selectedCount = selectedJobs.size;
  const hasSelection = selectedCount > 0;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

      return (
      <div className="min-h-screen bg-background">
        <Navbar />

      <div className={`container mx-auto p-6 max-w-7xl transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header */}
        <div className={`relative mb-8 transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}> 
          {/* Soft background accents */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-10 -left-8 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_60%)] blur-2xl" />
            <div className="absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_60%)] blur-2xl" />
          </div>
          {(
            <p className="text-sm text-muted-foreground mb-1">
              Welcome back{firstName ? `, ${firstName}` : ''} 👋
            </p>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                Job Tracker.
              </h1>
              <p className="text-muted-foreground">
                Track your job applications and stay organized
              </p>
            </div>
          </div>
        </div>

        {/* Gmail Connected banner - only shown when actually connected */}
        {gmailConnected && <div className={`mb-6 transition-all duration-300 delay-75 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-500 p-[1px]">
            <div className="relative rounded-xl bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                      <MailCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-background" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">Gmail Connected</CardTitle>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">Ready to import applications</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/import/gmail')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs"
                >
                  Open Import
                </Button>
              </div>
            </div>
          </Card>
        </div>}

        {/* ── Zero-state onboarding ─────────────────────────────────────── */}
        {!loading && internships.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-border">
              <Briefcase className="h-10 w-10 text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Start tracking your job search</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Add applications manually or import straight from Gmail — everything in one place.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Button
                onClick={() => navigate('/add')}
                className="flex items-center gap-2 px-6"
              >
                <Plus className="h-4 w-4" />
                Add your first application
              </Button>
              {gmailConnected ? (
                <Button variant="outline" onClick={() => navigate('/import/gmail')} className="flex items-center gap-2 px-6">
                  <MailCheck className="h-4 w-4" />
                  Import from Gmail
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/settings?tab=integrations')} className="flex items-center gap-2 px-6">
                  <MailCheck className="h-4 w-4" />
                  Connect Gmail
                </Button>
              )}
            </div>

            {/* Feature hints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
              {[
                { icon: Briefcase,  title: 'Track everything',    desc: 'Log every application with status, date, notes, and salary.' },
                { icon: Kanban,     title: 'Visualise progress',  desc: 'Drag-and-drop Kanban board across every hiring stage.' },
                { icon: BarChart2,  title: 'See your stats',      desc: 'Response rates, timelines, and trends — all in Analytics.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-4 text-left">
                  <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {internships.length > 0 && <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          {[{
            label: 'Total Applications',
            icon: Briefcase,
            value: internships.length,
            color: 'from-blue-500/20 to-blue-500/5 text-blue-300'
          },{
            label: 'Online Assessments',
            icon: ClipboardList,
            value: statusCounts['Online Assessment'] || 0,
            color: 'from-violet-500/20 to-violet-500/5 text-violet-300'
          },{
            label: 'Interview',
            icon: TrendingUp,
            value: statusCounts['Interview'] || 0,
            color: 'from-amber-500/20 to-amber-500/5 text-amber-300'
          },{
            label: 'Accepted',
            icon: CheckCircle2,
            value: statusCounts.Accepted || 0,
            color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300'
          },{
            label: 'Rejected',
            icon: XCircle,
            value: statusCounts.Rejected || 0,
            color: 'from-rose-500/20 to-rose-500/5 text-rose-300'
          },{
            label: 'Response Rate',
            icon: TrendingUp,
            value: internships.length > 0
              ? Math.round(((statusCounts['Online Assessment'] || 0) + (statusCounts.Accepted || 0)) / internships.length * 100) + '%'
              : '0%'
          }].map((stat, i) => (
            <Card key={stat.label} className="rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 h-16">
                <CardTitle className="text-sm font-medium flex items-center gap-2 leading-tight">
                  <stat.icon className={`h-4 w-4 ${stat.color?.split(' ').pop() || 'text-muted-foreground'}`} />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl leading-none font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>}

        {/* Filters, Layout and Actions */}
        {internships.length > 0 && <>
        <div className={`flex flex-col sm:flex-row gap-4 mb-6 relative z-50 transition-all duration-300 delay-150 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue>Filters</SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[1000] min-w-[180px]">
              <SelectItem value="all">All</SelectItem>
              {JOB_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="whitespace-nowrap">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selection Mode Toggle */}
          {!isSelectionMode && filteredInternships.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsSelectionMode(true)}
              className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <CheckSquare className="h-4 w-4" />
              Select
            </Button>
          )}
        </div>

        {/* Selection Mode Header */}
        {isSelectionMode && (
          <div className={`mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Selection Mode
                </span>
                {hasSelection && (
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    {selectedCount} job{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllJobs}
                  className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteAllDialogOpen(true)}
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
                {hasSelection && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectionMode}
                  aria-label="Exit selection mode"
                  className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Indicator */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Search Results
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {filteredInternships.length} of {internships.length} internships
                </span>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Clear Search
              </button>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Showing results for: <span className="font-medium">"{searchTerm}"</span>
            </p>
          </div>
        )}

        {/* Internship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/70 bg-background/50 animate-pulse p-5 space-y-3 min-h-[200px]">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-3/5" />
                  <div className="h-6 bg-muted rounded-full w-20" />
                </div>
                <div className="h-3 bg-muted rounded w-2/5" />
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4 mt-2" />
              </div>
            ))
          ) : (
            pageItems.map((internship, i) => (
              <Card
                key={internship._id}
                style={{ transitionDelay: `${i * 70}ms` }}
                className="relative h-full min-h-[320px] max-h-[320px] flex flex-col rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Selection Checkbox - Only show in selection mode */}
                {isSelectionMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => toggleJobSelection(internship._id)}
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {selectedJobs.has(internship._id) ? (
                        <CheckSquare className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                <CardHeader className="pt-6 pb-2">
                      <div className="flex justify-between items-start w-full">
                        <div className={isSelectionMode ? 'pr-8' : ''}>
                          <CardTitle className="text-lg clamp-1">{internship.role}</CardTitle>
                          <CardDescription className="flex items-center mt-1 clamp-1">
                            <Building className="h-4 w-4 mr-1" />
                            {internship.company}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(internship.status)} rounded-full px-2 py-1 text-xs`}>
                          {internship.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="clamp-1">{internship.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          Applied {new Date(internship.dateApplied).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        </div>
                        {internship.interviewDate && (
                          <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            Interview: {new Date(internship.interviewDate).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {Array.isArray(internship.statusHistory) && internship.statusHistory.length > 1 && (() => {
                          const hist = internship.statusHistory;
                          const changes = hist.filter((h, idx) => idx === 0 || h.status !== hist[idx - 1].status);
                          if (changes.length < 2) return null;
                          const last = changes[changes.length - 1];
                          const when = last.at ? new Date(last.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                          return (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
                              {`→ ${last.status}${when ? ` · ${when}` : ''}`}
                            </div>
                          );
                        })()}
                        {internship.stipend && (
                          <div className="text-sm font-medium text-green-600">
                            {internship.stipend}
                          </div>
                        )}
                        {internship.notes && (
                          <p className="text-sm text-muted-foreground clamp-2">
                            {internship.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-auto pt-3 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingInternship({
                              _id: internship._id,
                              company: internship.company,
                              position: internship.role,
                              location: internship.location,
                              status: internship.status,
                              salary: internship.stipend,
                              appliedDate: internship.dateApplied,
                              interviewDate: internship.interviewDate,
                              notes: internship.notes
                            });
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex items-center justify-between py-3 rounded-xl border border-border bg-card px-3 mt-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filteredInternships.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, filteredInternships.length)}</span> of <span className="text-foreground font-medium">{filteredInternships.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 px-2">«</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-2">‹</Button>
            <div className="text-sm">Page {page} / {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 px-2">›</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="h-8 px-2">»</Button>
          </div>
        </div>

        {filteredInternships.length === 0 && (searchTerm || statusFilter !== 'all') && (
          <Card className="text-center py-12 border-dashed mt-4">
            <CardContent className="flex flex-col items-center gap-3">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-foreground">No results</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Clear filters</Button>
            </CardContent>
          </Card>
        )}
        </>}
      </div>

      {/* Add/Edit Internship Modal */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[840px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingInternship ? 'Edit Job' : 'Add New Job'}
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingInternship(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            </DialogHeader>
        
            <InternshipForm
              internship={editingInternship}
              onSubmit={editingInternship ? handleEditInternship : handleAddInternship}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingInternship(null);
              }}
              onDelete={editingInternship ? () => {
                handleDeleteInternship(editingInternship._id);
                setIsFormOpen(false);
                setEditingInternship(null);
              } : undefined}
              onDeleteEmail={handleDeleteEmail}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirm Bulk Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedCount} selected job{selectedCount !== 1 ? 's' : ''}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                {deleting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting…' : `Delete ${selectedCount} Job${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete All Internships
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning: This action cannot be undone
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      You are about to delete <strong>all {internships.length} internship{internships.length !== 1 ? 's' : ''}</strong> from your account. 
                      This will permanently remove all your application data, including:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All application records</li>
                      <li>Interview schedules</li>
                      <li>Notes and comments</li>
                      <li>Application history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteAllDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                {deleting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting…' : `Delete All ${internships.length} Internship${internships.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InternshipDashboard;
