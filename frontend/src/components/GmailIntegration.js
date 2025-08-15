import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import config from '../config/config';
import { useAuth } from '../contexts/AuthContext';

export function GmailIntegration({ onApplicationsFound }) {
  const { user } = useAuth();
  const [gmailStatus, setGmailStatus] = useState({ connected: false, lastConnected: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [detectedApplications, setDetectedApplications] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check Gmail connection status on component mount
  useEffect(() => {
    checkGmailStatus();
    // Clear any stale detected applications
    setDetectedApplications([]);
  }, []);

  // Debug: Log when detectedApplications changes
  useEffect(() => {
    console.log('detectedApplications state changed:', detectedApplications);
    console.log('detectedApplications length:', detectedApplications.length);
  }, [detectedApplications]);

  const checkGmailStatus = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}No/api/gmail/status`);
      setGmailStatus(response.data);
    } catch (error) {
      console.error('Error checking Gmail status:', error);
    }
  };

  const connectGmail = () => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    // Redirect to backend OAuth endpoint with user id if available
    const uid = user?.id || user?._id;
    const url = uid
      ? `${config.API_BASE_URL}/api/gmail/auth?u=${encodeURIComponent(uid)}`
      : `${config.API_BASE_URL}/api/gmail/auth`;
    window.location.href = url;
  };

  const disconnectGmail = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`${config.API_BASE_URL}/api/gmail/disconnect`);
      setGmailStatus({ connected: false, lastConnected: null });
      setDetectedApplications([]);
      setError(null);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      setError('Failed to disconnect Gmail');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobApplications = async () => {
    try {
      setIsFetching(true);
      setError(null);
      
      console.log('Fetching job applications...');
      
      // Test the connection first
      try {
        const statusResponse = await axios.get(`${config.API_BASE_URL}/api/gmail/status`);
        console.log('Gmail status:', statusResponse.data);
      } catch (statusError) {
        console.error('Error checking Gmail status:', statusError);
      }
      
      const response = await axios.get(`${config.API_BASE_URL}/api/gmail/fetch-emails`);
      
      console.log('Response received:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.data.success) {
        console.log('Applications found:', response.data.applications.length);
        console.log('First application:', response.data.applications[0]);
        
        // Get deleted email IDs from localStorage
        const deletedEmails = JSON.parse(localStorage.getItem('deletedEmails') || '[]');
        console.log('Deleted emails from localStorage:', deletedEmails);
        
        // Filter out any applications that might already be in the database or were deleted
        const filteredApplications = response.data.applications.filter(app => {
          // Check if this email ID is already in the detected applications
          const isAlreadyDetected = detectedApplications.some(detected => detected.emailId === app.emailId);
          if (isAlreadyDetected) {
            console.log('Filtering out already detected application:', app.emailId);
            return false;
          }
          
          // Check if this email ID was deleted by user
          const isDeleted = deletedEmails.includes(app.emailId);
          if (isDeleted) {
            console.log('Filtering out deleted application:', app.emailId);
            return false;
          }
          
          return true;
        });
        
        console.log('Filtered applications:', filteredApplications.length);
        
        // De-duplicate on company+position to avoid repeated entries
        const uniqueMap = new Map();
        for (const app of filteredApplications) {
          const key = `${(app.company||'').toLowerCase()}::${(app.position||'').toLowerCase()}`;
          if (!uniqueMap.has(key)) uniqueMap.set(key, app);
        }
        const uniqueApplications = Array.from(uniqueMap.values());

        setDetectedApplications(uniqueApplications);
        setInfo(uniqueApplications.length === 0 ? 'No new job application emails found.' : null);
        
        // Force a re-render by updating state
        setTimeout(() => {
          console.log('Current detectedApplications state:', detectedApplications);
        }, 100);
        
        if (uniqueApplications.length > 0) {
          console.log('Calling onApplicationsFound with:', uniqueApplications);
          onApplicationsFound(uniqueApplications);
        }
      } else {
        console.error('Response indicates failure:', response.data);
        setError('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setError(error.response?.data?.error || 'Failed to fetch job applications');
    } finally {
      setIsFetching(false);
    }
  };

  const addApplicationToTracker = async (application) => {
    try {
      // Remove email-specific fields before sending to job tracker
      const { emailId, subject, snippet, ...jobData } = application;
      
      console.log('Sending job data to backend:', {
        company: jobData.company,
        role: jobData.position,
        location: jobData.location,
        status: jobData.status,
        stipend: '', // No salary info from email parsing
        dateApplied: jobData.appliedDate,
        notes: `Imported from Gmail\nSubject: ${subject}\nSnippet: ${snippet}`,
        emailId: emailId
      });
      
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company: jobData.company,
        role: jobData.position,
        location: jobData.location,
        status: jobData.status,
        stipend: '', // No salary info from email parsing
        dateApplied: jobData.appliedDate,
        notes: `Imported from Gmail\nSubject: ${subject}\nSnippet: ${snippet}`,
        emailId: emailId // Include the email ID to track processed emails
      });

      console.log('Successfully added application with emailId:', emailId);

      // Remove from detected applications
      setDetectedApplications(prev => 
        prev.filter(app => app.emailId !== application.emailId)
      );

      // Refresh the parent component to show the newly added job
      if (onApplicationsFound) {
        onApplicationsFound(['refresh']); // Signal to refresh the dashboard
      }
    } catch (error) {
      console.error('Error adding application to tracker:', error);
      console.error('Error response:', error.response?.data);
      setError('Failed to add application to tracker');
    }
  };

  const editApplication = (application) => {
    setEditingApplication(application);
    setIsEditModalOpen(true);
  };

  const saveEditedApplication = (editedData) => {
    setDetectedApplications(prev => 
      prev.map(app => 
        app.emailId === editingApplication.emailId 
          ? { ...app, ...editedData }
          : app
      )
    );
    setEditingApplication(null);
    setIsEditModalOpen(false);
  };

  // Save edits and immediately add the application to the tracker
  const saveEditedAndAdd = async (editedData) => {
    const merged = { ...editingApplication, ...editedData };
    await addApplicationToTracker(merged);
    setEditingApplication(null);
    setIsEditModalOpen(false);
  };

  const cancelEdit = () => {
    setEditingApplication(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteEmail = (emailId) => {
    console.log('Removing email from scan results:', emailId);
    
    // Store the deleted email ID in localStorage so it won't show up in future scans
    const deletedEmails = JSON.parse(localStorage.getItem('deletedEmails') || '[]');
    if (!deletedEmails.includes(emailId)) {
      deletedEmails.push(emailId);
      localStorage.setItem('deletedEmails', JSON.stringify(deletedEmails));
    }
    
    // Remove from detected applications
    setDetectedApplications(prev => prev.filter(app => app.emailId !== emailId));
    console.log('Email removed from scan results and stored as deleted:', emailId);
  };

  const addAllApplications = async () => {
    try {
      setIsLoading(true);
      
      for (const application of detectedApplications) {
        await addApplicationToTracker(application);
      }
      
      // Clear all detected applications after adding them all
      setDetectedApplications([]);
      
      // Refresh the parent component to show all newly added jobs
      if (onApplicationsFound) {
        onApplicationsFound(['refresh']); // Signal to refresh the dashboard
      }
    } catch (error) {
      console.error('Error adding all applications:', error);
      setError('Failed to add some applications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Gmail Integration</CardTitle>
            {gmailStatus.connected && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            {detectedApplications.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {detectedApplications.length} detected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && gmailStatus.connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchJobApplications();
                }}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        <CardDescription>
          Connect your Gmail to automatically detect job application emails
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {gmailStatus.connected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">Connected to Gmail</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Not connected</span>
              </>
            )}
          </div>
          
          {gmailStatus.connected ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchJobApplications}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Scan Emails
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectGmail}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectGmail}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Connect Gmail
            </Button>
          )}
        </div>

        {/* Error/Info Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {info && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">{info}</p>
          </div>
        )}

        {/* Detected Applications */}
        {detectedApplications.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Detected Applications ({detectedApplications.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={addAllApplications}
                disabled={isLoading}
              >
                Add All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {detectedApplications
                .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)) // Sort by date, newest first
                .map((app) => (
                <div
                  key={app.emailId}
                  className="p-3 border rounded-md bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{app.position}</span>
                        <Badge variant="secondary">{app.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{app.company}</p>
                      <p className="text-xs text-gray-500">
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                      {app.subject && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Subject: {app.subject}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editApplication(app)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addApplicationToTracker(app)}
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmail(app.emailId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove from scan results (won't show up in future scans)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        


        {/* Edit Application Modal */}
        {isEditModalOpen && editingApplication && (
          <EditApplicationModal
            application={editingApplication}
            onSave={saveEditedApplication}
            onSaveAndAdd={saveEditedAndAdd}
            onCancel={cancelEdit}
          />
        )}
      </CardContent>
      )}
    </Card>
  );
}

// Edit Application Modal Component
function EditApplicationModal({ application, onSave, onSaveAndAdd, onCancel }) {
  const [formData, setFormData] = useState({
    company: application.company,
    position: application.position,
    status: application.status,
    location: application.location || '',
    appliedDate: application.appliedDate
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Application
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
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
                  <SelectItem value="Online Assessment">Online Assessment</SelectItem>
                  <SelectItem value="Phone Interview">Phone Interview</SelectItem>
                  <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                  <SelectItem value="Final Interview">Final Interview</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveAndAdd(formData)}
              className="flex-1"
            >
              Save & Add
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 