import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ArrowLeft, Target } from 'lucide-react';
import axios from 'axios';

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
      await axios.post("http://localhost:3001/api/jobs", {
        company: formData.company,
        role: formData.position,
        location: formData.location,
        status: formData.status,
        stipend: formData.salary,
        dateApplied: formData.appliedDate,
        notes: formData.notes
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl">Internly</span>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
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