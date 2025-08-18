import React, { useState } from 'react';
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
    notes: ''
  });

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
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company: formData.company,
        role: formData.position,
        location: formData.location,
        status: formData.status,
        stipend: formData.salary,
        dateApplied: formData.appliedDate,
        notes: formData.notes
      }, {
        withCredentials: true,
        headers: csrf ? { 'X-CSRF-Token': csrf } : {}
      });
      alert("Internship added successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding job:", error);
      alert("Failed to add internship");
    }
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

      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Internship</h1>
          <p className="text-muted-foreground">
            Fill out the details below to track your internship application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Internship Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="e.g., Google"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="e.g., Software Engineering Intern"
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Online Assessment">Online Assessment</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                    </SelectContent>
                  </Select>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (Optional)</Label>
                  <Input
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    placeholder="e.g., $8,000/month"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the internship role and responsibilities..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes, interview feedback, etc..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Add Internship
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AddJob; 