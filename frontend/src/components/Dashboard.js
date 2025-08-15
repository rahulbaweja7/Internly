import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Calendar, Building, MapPin, HelpCircle, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { InternshipForm } from './InternshipForm';
import { GmailIntegration } from './GmailIntegration';
import { Navbar } from './Navbar';

export function InternshipDashboard() {
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Removed unused urlSearchTerm state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthMessage, setOauthMessage] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Removed unused auth destructuring to satisfy CI

  // Handle OAuth callback response and search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gmailConnected = params.get('gmail_connected');
    const gmailError = params.get('gmail_error');
    const searchParam = params.get('search');
    
    if (gmailConnected === 'true') {
      setOauthMessage({ type: 'success', text: 'Gmail connected successfully! You can now scan for job applications.' });
      // Clear the URL parameters
      navigate('/dashboard', { replace: true });
    } else if (gmailError === 'true') {
      setOauthMessage({ type: 'error', text: 'Failed to connect Gmail. Please try again.' });
      // Clear the URL parameters
      navigate('/dashboard', { replace: true });
    } else if (searchParam) {
      // Handle search from navbar
      setSearchTerm(searchParam);
      // Clear the search parameter from URL
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  // Fetch jobs from backend
  const fetchJobs = () => {
    axios.get(`${config.API_BASE_URL}/api/jobs`)
      .then((res) => {
        console.log('Fetched jobs from backend:', res.data);
        // Debug: Check if jobs have emailId
        res.data.forEach((job, index) => {
          console.log(`Job ${index + 1}:`, {
            company: job.company,
            position: job.role,
            hasEmailId: !!job.emailId,
            emailId: job.emailId
          });
        });
        setInternships(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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
    .sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied)); // Sort by date, newest first

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Online Assessment': return 'bg-purple-100 text-purple-800';
      case 'Interview': return 'bg-teal-100 text-teal-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddInternship = async (internship) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company: internship.company,
        role: internship.position,
        location: internship.location,
        status: internship.status,
        stipend: internship.salary,
        dateApplied: internship.appliedDate,
        notes: internship.notes
      });
      setInternships([...internships, response.data]);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error adding job:", error);
      alert("Failed to add job");
    }
  };

  const handleEditInternship = async (updatedInternship) => {
    try {
      const response = await axios.put(`${config.API_BASE_URL}/api/jobs/${updatedInternship._id}`, {
        company: updatedInternship.company,
        role: updatedInternship.position,
        location: updatedInternship.location,
        status: updatedInternship.status,
        stipend: updatedInternship.salary,
        dateApplied: updatedInternship.appliedDate,
        notes: updatedInternship.notes
      });
      setInternships(internships.map(internship => 
        internship._id === updatedInternship._id ? response.data : internship
      ));
      setEditingInternship(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Failed to update job");
    }
  };

  const handleDeleteInternship = async (id) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`);
      setInternships(internships.filter(internship => internship._id !== id));
      // Remove from selected jobs if it was selected
      setSelectedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job");
    }
  };

  // Bulk delete functionality
  const handleBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedJobs);
      const deletePromises = selectedIds.map(id => axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`));
      await Promise.all(deletePromises);
      
      setInternships(internships.filter(internship => !selectedJobs.has(internship._id)));
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error bulk deleting jobs:", error);
      alert("Failed to delete some jobs");
    }
  };

  // Delete all internships functionality
  const handleDeleteAll = async () => {
    try {
      console.log('Attempting to delete all jobs...');
      const response = await axios.delete(`${config.API_BASE_URL}/api/jobs/delete-all`);
      console.log('Delete all response:', response.data);
      setInternships([]);
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all jobs:", error);
      console.error("Error response:", error.response?.data);
      alert("Failed to delete all internships: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      const response = await axios.delete(`${config.API_BASE_URL}/api/gmail/delete-email/${emailId}`);
      if (response.data.success) {
        alert('Email deleted successfully from Gmail!');
        // Optionally refresh the jobs list or update the specific job
        fetchJobs();
      }
    } catch (error) {
      console.error("Error deleting email from Gmail:", error);
      alert('Failed to delete email from Gmail. Please try again.');
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

      return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <Navbar />

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Internship Tracker</h1>
          <p className="text-muted-foreground">
            Track your internship applications and stay organized
          </p>
        </div>

        {/* OAuth Message */}
        {oauthMessage && (
          <div className={`mb-6 p-4 rounded-md ${
            oauthMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <p className="text-sm">{oauthMessage.text}</p>
          </div>
        )}

        {/* Gmail Integration */}
        <GmailIntegration onApplicationsFound={(applications) => {
          // Refresh the internships list when new applications are found or added
          console.log('Applications found in Dashboard:', applications);
          
          // If applications is an array with 'refresh' signal, or if there are actual applications
          if (applications.length > 0) {
            // Fetch the updated list from the backend
            fetchJobs();
          }
        }} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{internships.length}</div>
            </CardContent>
          </Card>
                  <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts['Online Assessment'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.Accepted || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlisted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.Waitlisted || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.Rejected || 0}</div>
          </CardContent>
        </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
                          <div className="text-2xl font-bold">
              {internships.length > 0 
                ? Math.round(((statusCounts['Online Assessment'] || 0) + (statusCounts.Accepted || 0)) / internships.length * 100)
                : 0}%
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search companies, positions, locations, notes, or stipends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue>Filters</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Online Assessment">Online Assessment</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
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
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
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
                  className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                >
                  <X className="h-4 w-4" />
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

        {/* Internship Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading internships...</p>
            </div>
          ) : (
            filteredInternships.map((internship) => (
              <Card key={internship._id} className="hover:shadow-lg transition-shadow relative h-full min-h-[260px] max-h-[260px] flex flex-col">
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
                  <div className="flex justify-between items-start">
                    <div className={isSelectionMode ? "pr-8" : ""}>
                      <CardTitle className="text-lg clamp-1">{internship.role}</CardTitle>
                      <CardDescription className="flex items-center mt-1 clamp-1">
                        <Building className="h-4 w-4 mr-1" />
                        {internship.company}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(internship.status)}>
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
                      Applied {new Date(internship.dateApplied).toLocaleDateString()}
                    </div>
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
                  <div className="flex gap-2 mt-auto pt-3">
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

        {filteredInternships.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                No internships found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first internship to get started!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Button */}
      <button className="fixed bottom-6 right-6 h-12 w-12 bg-gray-800 dark:bg-gray-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Add/Edit Internship Modal */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingInternship ? 'Edit Internship' : 'Add New Internship'}
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
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedCount} Job{selectedCount !== 1 ? 's' : ''}
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
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All {internships.length} Internship{internships.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InternshipDashboard;
