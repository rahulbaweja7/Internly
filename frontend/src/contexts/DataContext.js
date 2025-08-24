import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import config from '../config/config';
import { useAuth } from './AuthContext';
import { deduplicatedApiCall } from '../lib/utils';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  const [fetching, setFetching] = useState(false);

  const fetchJobs = useCallback(async (force = false) => {
    // Don't fetch if no user
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (fetching) return;
    
    // Cache for 60 seconds to avoid excessive API calls
    const now = Date.now();
    if (!force && now - lastFetch < 60000) {
      return;
    }

    setFetching(true);
    setError(null);
    
    try {
      const data = await deduplicatedApiCall(`${config.API_BASE_URL}/api/jobs?summary=1`);
      setJobs(data || []);
      setLastFetch(now);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err);
      setLoading(false);
    } finally {
      setFetching(false);
    }
  }, [fetching, lastFetch, user]);

  // Initial fetch when user changes
  useEffect(() => {
    if (user) {
      fetchJobs();
    } else {
      setJobs([]);
      setLoading(false);
    }
  }, [user, fetchJobs]);

  // Add a new job optimistically
  const addJob = useCallback((newJob) => {
    setJobs(prev => [newJob, ...prev]);
  }, []);

  // Update a job
  const updateJob = useCallback((jobId, updates) => {
    setJobs(prev => prev.map(job => 
      job._id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  // Delete a job
  const deleteJob = useCallback((jobId) => {
    setJobs(prev => prev.filter(job => job._id !== jobId));
  }, []);

  // Delete multiple jobs
  const deleteJobs = useCallback((jobIds) => {
    setJobs(prev => prev.filter(job => !jobIds.includes(job._id)));
  }, []);

  const value = {
    jobs,
    loading,
    error,
    fetchJobs,
    addJob,
    updateJob,
    deleteJob,
    deleteJobs,
    refresh: () => fetchJobs(true)
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
