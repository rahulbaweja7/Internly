import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

export function GmailIntegration({ onApplicationsFound }) {
  const [gmailStatus, setGmailStatus] = useState({ connected: false, lastConnected: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [detectedApplications, setDetectedApplications] = useState([]);
  const [error, setError] = useState(null);

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
      const response = await axios.get('http://localhost:3001/api/gmail/status');
      setGmailStatus(response.data);
    } catch (error) {
      console.error('Error checking Gmail status:', error);
    }
  };

  const connectGmail = () => {
    setIsLoading(true);
    setError(null);
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:3001/api/gmail/auth';
  };

  const disconnectGmail = async () => {
    try {
      setIsLoading(true);
      await axios.delete('http://localhost:3001/api/gmail/disconnect');
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
        const statusResponse = await axios.get('http://localhost:3001/api/gmail/status');
        console.log('Gmail status:', statusResponse.data);
      } catch (statusError) {
        console.error('Error checking Gmail status:', statusError);
      }
      
      const response = await axios.get('http://localhost:3001/api/gmail/fetch-emails');
      
      console.log('Response received:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.data.success) {
        console.log('Applications found:', response.data.applications.length);
        console.log('First application:', response.data.applications[0]);
        
        // Filter out any applications that might already be in the database
        const filteredApplications = response.data.applications.filter(app => {
          // Check if this email ID is already in the detected applications
          const isAlreadyDetected = detectedApplications.some(detected => detected.emailId === app.emailId);
          if (isAlreadyDetected) {
            console.log('Filtering out already detected application:', app.emailId);
            return false;
          }
          return true;
        });
        
        console.log('Filtered applications:', filteredApplications.length);
        
        setDetectedApplications(filteredApplications);
        
        // Force a re-render by updating state
        setTimeout(() => {
          console.log('Current detectedApplications state:', detectedApplications);
        }, 100);
        
        if (filteredApplications.length > 0) {
          console.log('Calling onApplicationsFound with:', filteredApplications);
          onApplicationsFound(filteredApplications);
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
      
      await axios.post('http://localhost:3001/api/jobs', {
        company: jobData.company,
        role: jobData.position,
        location: jobData.location,
        status: jobData.status,
        stipend: jobData.salary || '',
        dateApplied: jobData.appliedDate,
        notes: `Imported from Gmail\nSubject: ${subject}\nSnippet: ${snippet}`,
        emailId: emailId // Include the email ID to track processed emails
      });

      console.log('Added application with emailId:', emailId);

      // Remove from detected applications
      setDetectedApplications(prev => 
        prev.filter(app => app.emailId !== application.emailId)
      );

      // Refresh the parent component
      if (onApplicationsFound) {
        onApplicationsFound([]);
      }
    } catch (error) {
      console.error('Error adding application to tracker:', error);
      setError('Failed to add application to tracker');
    }
  };

  const addAllApplications = async () => {
    try {
      setIsLoading(true);
      
      for (const application of detectedApplications) {
        await addApplicationToTracker(application);
      }
      
      // Clear all detected applications after adding them all
      setDetectedApplications([]);
    } catch (error) {
      console.error('Error adding all applications:', error);
      setError('Failed to add some applications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect your Gmail to automatically detect job application emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
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
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {detectedApplications.map((app) => (
                <div
                  key={app.emailId}
                  className="p-3 border rounded-md bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{app.company}</span>
                        <Badge variant="secondary">{app.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{app.position}</p>
                      <p className="text-xs text-gray-500">
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                      {app.subject && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Subject: {app.subject}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addApplicationToTracker(app)}
                      className="ml-2"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2">
            Debug: detectedApplications.length = {detectedApplications.length}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const testData = [
                  {
                    company: 'Test Company',
                    position: 'Test Position',
                    status: 'Applied',
                    appliedDate: '2025-08-02',
                    emailId: 'test-1',
                    subject: 'Test Subject'
                  }
                ];
                console.log('Setting test data:', testData);
                setDetectedApplications(testData);
              }}
              className="ml-2"
            >
              Test Display
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await axios.get('http://localhost:3001/api/gmail/check-processed');
                  console.log('Processed emails check:', response.data);
                  alert(`Total jobs: ${response.data.totalJobs}\nJobs with emailId: ${response.data.jobsWithEmailId}\nDuplicates: ${response.data.duplicates.length}`);
                } catch (error) {
                  console.error('Error checking processed emails:', error);
                }
              }}
              className="ml-2"
            >
              Check Duplicates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await axios.delete('http://localhost:3001/api/gmail/clear-duplicates');
                  console.log('Clear duplicates result:', response.data);
                  alert(`Deleted ${response.data.deletedCount} duplicates`);
                  // Refresh the page to show updated data
                  window.location.reload();
                } catch (error) {
                  console.error('Error clearing duplicates:', error);
                }
              }}
              className="ml-2"
            >
              Clear Duplicates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await axios.post('http://localhost:3001/api/gmail/update-email-ids');
                  console.log('Update email IDs result:', response.data);
                  alert(`Updated ${response.data.updatedCount} jobs with email IDs`);
                  // Refresh the page to show updated data
                  window.location.reload();
                } catch (error) {
                  console.error('Error updating email IDs:', error);
                }
              }}
              className="ml-2"
            >
              Update Email IDs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await axios.delete('http://localhost:3001/api/gmail/clear-duplicates-by-content');
                  console.log('Clear duplicates by content result:', response.data);
                  alert(`Deleted ${response.data.deletedCount} duplicates by content`);
                  // Refresh the page to show updated data
                  window.location.reload();
                } catch (error) {
                  console.error('Error clearing duplicates by content:', error);
                }
              }}
              className="ml-2"
            >
              Clear by Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 