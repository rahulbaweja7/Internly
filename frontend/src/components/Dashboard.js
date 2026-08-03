import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Trash2, CheckSquare, X, Briefcase, MailCheck, Plus, Kanban, BarChart2 } from 'lucide-react';
import { InternshipForm } from './InternshipForm';
import { Navbar } from './Navbar';
import { JobCard } from './JobCard';
import { DashboardStats } from './DashboardStats';
import { DeleteDialogs } from './DeleteDialogs';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useJobActions } from '../hooks/useJobActions';
import { useJobFilters, PAGE_SIZE } from '../hooks/useJobFilters';
import { JOB_STATUSES } from '../constants/jobStatuses';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading your applications...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InternshipDashboard() {
  const { jobs: internships, loading, gmailConnected } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const firstName = (user?.name || user?.fullName || user?.email || '')
    .toString()
    .split(' ')[0]
    .split('@')[0];

  // Sync search from URL params
  useEffect(() => {
    const param = new URLSearchParams(location.search).get('search');
    setSearchTerm(param || '');
  }, [location.search]);

  // Reset page on filter/data changes
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, internships.length]);

  // Entrance animation
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const { filteredInternships, pageItems, totalPages, start, statusCounts } = useJobFilters({
    internships,
    searchTerm,
    statusFilter,
    page,
  });

  const {
    deleting,
    handleAddInternship,
    handleEditInternship,
    handleDeleteInternship,
    handleBulkDelete,
    handleDeleteAll,
    handleDeleteEmail,
  } = useJobActions({
    selectedJobs,
    setSelectedJobs,
    setIsSelectionMode,
    setIsBulkDeleteDialogOpen,
    setIsDeleteAllDialogOpen,
    setIsFormOpen,
    setEditingInternship,
  });

  const openEditForm = (internship) => {
    setEditingInternship({
      _id: internship._id,
      company: internship.company,
      position: internship.role,
      location: internship.location,
      status: internship.status,
      salary: internship.stipend,
      appliedDate: internship.dateApplied,
      interviewDate: internship.interviewDate,
      notes: internship.notes,
    });
    setIsFormOpen(true);
  };

  const toggleJobSelection = (id) =>
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedCount = selectedJobs.size;

  if (!mounted || loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className={`container mx-auto p-6 max-w-7xl transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Header */}
        <div className="relative mb-8">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-10 -left-8 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_60%)] blur-2xl" />
            <div className="absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_60%)] blur-2xl" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">Job Tracker.</h1>
          <p className="text-muted-foreground">Track your job applications and stay organized</p>
        </div>

        {/* Gmail banner */}
        {gmailConnected && (
          <div className="mb-6">
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
                  <Button onClick={() => navigate('/import/gmail')} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs">
                    Open Import
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Zero-state onboarding */}
        {internships.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-border">
              <Briefcase className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Start tracking your job search</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Add applications manually or import straight from Gmail — everything in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Button onClick={() => navigate('/add')} className="flex items-center gap-2 px-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
              {[
                { icon: Briefcase, title: 'Track everything',   desc: 'Log every application with status, date, notes, and salary.' },
                { icon: Kanban,    title: 'Visualise progress', desc: 'Drag-and-drop Kanban board across every hiring stage.' },
                { icon: BarChart2, title: 'See your stats',     desc: 'Response rates, timelines, and trends — all in Analytics.' },
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

        {internships.length > 0 && (
          <>
            <DashboardStats internships={internships} statusCounts={statusCounts} />

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-6 relative z-50 transition-all duration-300 delay-150 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue>Filters</SelectValue></SelectTrigger>
                <SelectContent className="z-[1000] min-w-[220px]">
                  <SelectItem value="all">All</SelectItem>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="whitespace-nowrap">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isSelectionMode && filteredInternships.length > 0 && (
                <Button variant="outline" onClick={() => setIsSelectionMode(true)} className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50">
                  <CheckSquare className="h-4 w-4" />
                  Select
                </Button>
              )}
            </div>

            {/* Selection mode bar */}
            {isSelectionMode && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Selection Mode</span>
                    {selectedCount > 0 && (
                      <span className="text-sm text-orange-700 dark:text-orange-300">
                        {selectedCount} job{selectedCount !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedJobs(new Set(filteredInternships.map((j) => j._id)))} className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsDeleteAllDialogOpen(true)} className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                      Delete All
                    </Button>
                    {selectedCount > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setSelectedJobs(new Set())} className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                          Clear
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Selected
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedJobs(new Set()); }} aria-label="Exit selection mode" className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Search results banner */}
            {searchTerm && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Search Results</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">{filteredInternships.length} of {internships.length} internships</span>
                  </div>
                  <button onClick={() => setSearchTerm('')} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                    Clear Search
                  </button>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Showing results for: <span className="font-medium">"{searchTerm}"</span>
                </p>
              </div>
            )}

            {/* Job grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((internship, i) => (
                <JobCard
                  key={internship._id}
                  internship={internship}
                  index={i}
                  isSelectionMode={isSelectionMode}
                  selectedJobs={selectedJobs}
                  toggleJobSelection={toggleJobSelection}
                  onEdit={openEditForm}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-3 rounded-xl border border-border bg-card px-3 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="text-foreground font-medium">{filteredInternships.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, filteredInternships.length)}</span>
                {' '}of{' '}
                <span className="text-foreground font-medium">{filteredInternships.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 px-2">«</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-2">‹</Button>
                <div className="text-sm">Page {page} / {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 px-2">›</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="h-8 px-2">»</Button>
              </div>
            </div>

            {/* Filtered empty state */}
            {filteredInternships.length === 0 && (searchTerm || statusFilter !== 'all') && (
              <Card className="text-center py-12 border-dashed mt-4">
                <CardContent className="flex flex-col items-center gap-3">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                  <div>
                    <p className="font-semibold text-foreground">No results</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Add / Edit dialog */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[840px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{editingInternship ? 'Edit Job' : 'Add New Job'}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => { setIsFormOpen(false); setEditingInternship(null); }}>✕</Button>
              </div>
            </DialogHeader>
            <InternshipForm
              internship={editingInternship}
              onSubmit={editingInternship ? handleEditInternship : handleAddInternship}
              onCancel={() => { setIsFormOpen(false); setEditingInternship(null); }}
              onDelete={editingInternship ? () => { handleDeleteInternship(editingInternship._id); setIsFormOpen(false); setEditingInternship(null); } : undefined}
              onDeleteEmail={handleDeleteEmail}
            />
          </DialogContent>
        </Dialog>
      )}

      <DeleteDialogs
        isBulkDeleteDialogOpen={isBulkDeleteDialogOpen}
        setIsBulkDeleteDialogOpen={setIsBulkDeleteDialogOpen}
        isDeleteAllDialogOpen={isDeleteAllDialogOpen}
        setIsDeleteAllDialogOpen={setIsDeleteAllDialogOpen}
        selectedCount={selectedCount}
        totalCount={internships.length}
        deleting={deleting}
        onBulkDelete={handleBulkDelete}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
}

export default InternshipDashboard;
