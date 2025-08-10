import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Trash2 } from 'lucide-react';

export function InternshipForm({ internship, onSubmit, onCancel, onDelete, onDeleteEmail }) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    status: 'Applied',
    appliedDate: '',
    description: '',
    salary: '',
    notes: ''
  });

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
        notes: internship.notes || ''
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
        notes: ''
      });
    }
  }, [internship]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position || !formData.location || !formData.appliedDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (internship) {
      onSubmit({
        ...internship,
        ...formData
      });
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
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
              {internship ? 'Update Internship' : 'Add Internship'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
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
  );
} 