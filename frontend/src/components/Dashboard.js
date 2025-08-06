import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Search, Calendar, Building, MapPin, ArrowLeft, HelpCircle, Target, RefreshCw, LogOut, User, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { InternshipForm } from './InternshipForm';
import { GmailIntegration } from './GmailIntegration';
import { Navbar } from './Navbar';
import { useAuth } from '../contexts/AuthContext';

export function InternshipDashboard() {
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthMessage, setOauthMessage] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle OAuth callback response
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gmailConnected = params.get('gmail_connected');
    const gmailError = params.get('gmail_error');
    
    if (gmailConnected === 'true') {
      setOauthMessage({ type: 'success', text: 'Gmail connected successfully! You can now scan for job applications.' });
      // Clear the URL parameters
      navigate('/dashboard', { replace: true });
    } else if (gmailError === 'true') {
      setOauthMessage({ type: 'error', text: 'Failed to connect Gmail. Please try again.' });
      // Clear the URL parameters
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  // Fetch jobs from backend
  const fetchJobs = () => {
    axios.get("http://localhost:3001/api/jobs")
      .then((res) => {
        console.log('Fetched jobs from backend:', res.data);
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

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Online Assessment': return 'bg-purple-100 text-purple-800';
      case 'Phone Interview': return 'bg-indigo-100 text-indigo-800';
      case 'Technical Interview': return 'bg-cyan-100 text-cyan-800';
      case 'Final Interview': return 'bg-teal-100 text-teal-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Waitlisted': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddInternship = async (internship) => {
    try {
      const response = await axios.post("http://localhost:3001/api/jobs", {
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
      const response = await axios.put(`http://localhost:3001/api/jobs/${updatedInternship._id}`, {
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
      await axios.delete(`http://localhost:3001/api/jobs/${id}`);
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
      const deletePromises = selectedIds.map(id => axios.delete(`http://localhost:3001/api/jobs/${id}`));
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto p-6 max-w-7xl relative z-10">
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
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search companies, positions, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Online Assessment">Online Assessment</SelectItem>
            <SelectItem value="Phone Interview">Phone Interview</SelectItem>
            <SelectItem value="Technical Interview">Technical Interview</SelectItem>
            <SelectItem value="Final Interview">Final Interview</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Waitlisted">Waitlisted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
          </Select>
          <Button
            variant="outline"
            onClick={fetchJobs}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {/* Selection Mode Toggle */}
          {!isSelectionMode && filteredInternships.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsSelectionMode(true)}
              className="flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <CheckSquare className="h-4 w-4" />
              Select Multiple
            </Button>
          )}
        </div>

        {/* Selection Mode Header */}
        {isSelectionMode && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-800">
                  Selection Mode
                </span>
                {hasSelection && (
                  <span className="text-sm text-orange-700">
                    {selectedCount} job{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasSelection && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllJobs}
                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
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
                  className="text-orange-600 hover:bg-orange-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
              <Card key={internship._id} className="hover:shadow-lg transition-shadow relative">
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
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={isSelectionMode ? "pr-8" : ""}>
                      <CardTitle className="text-lg">{internship.role}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        {internship.company}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(internship.status)}>
                      {internship.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {internship.location}
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {internship.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInternship(internship._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
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
      <button className="fixed bottom-6 right-6 h-12 w-12 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors">
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
    </div>
  );
}

export default InternshipDashboard;
