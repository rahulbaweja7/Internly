import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Search, Calendar, Building, MapPin, ArrowLeft, HelpCircle, Target } from 'lucide-react';
import { InternshipForm } from './InternshipForm';



export function InternshipDashboard() {
  const [internships, setInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch jobs from backend
  useEffect(() => {
    axios.get("http://localhost:3001/api/jobs")
      .then((res) => {
        setInternships(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setLoading(false);
      });
  }, []);

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Interview': return 'bg-yellow-100 text-yellow-800';
      case 'Offer': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
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
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job");
    }
  };

  const statusCounts = internships.reduce((acc, internship) => {
    acc[internship.status] = (acc[internship.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl">Internly</span>
            </div>
            <Button 
              onClick={() => {
                setEditingInternship(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Internship
            </Button>
            
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
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">


        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Internship Tracker</h1>
          <p className="text-muted-foreground">
            Track your internship applications and stay organized
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.Interview || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.Offer || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {internships.length > 0 
                  ? Math.round(((statusCounts.Interview || 0) + (statusCounts.Offer || 0)) / internships.length * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Internship Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading internships...</p>
            </div>
          ) : (
            filteredInternships.map((internship) => (
              <Card key={internship._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
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
    </div>
  );
}

export default InternshipDashboard;
