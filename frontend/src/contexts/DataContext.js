import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import config from '../config/config';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const JOBS_KEY = ['jobs'];
// Stable reference — prevents useEffect deps from firing on every render
// when the query hasn't returned data yet.
const EMPTY_JOBS = [];

async function fetchJobsFromApi() {
  const res = await fetch(`${config.API_BASE_URL}/api/jobs?summary=1`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: JOBS_KEY,
    queryFn: fetchJobsFromApi,
    enabled: !!user,
  });

  const jobs = data ?? EMPTY_JOBS;

  const addJob = useCallback((newJob) => {
    queryClient.setQueryData(JOBS_KEY, (prev = []) => [newJob, ...prev]);
  }, [queryClient]);

  const updateJob = useCallback((jobId, updates) => {
    queryClient.setQueryData(JOBS_KEY, (prev = []) =>
      prev.map(job => job._id === jobId ? { ...job, ...updates } : job)
    );
  }, [queryClient]);

  const deleteJob = useCallback((jobId) => {
    queryClient.setQueryData(JOBS_KEY, (prev = []) =>
      prev.filter(job => job._id !== jobId)
    );
  }, [queryClient]);

  const deleteJobs = useCallback((jobIds) => {
    queryClient.setQueryData(JOBS_KEY, (prev = []) =>
      prev.filter(job => !jobIds.includes(job._id))
    );
  }, [queryClient]);

  const fetchJobs = useCallback((force = false) => {
    if (force) queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    else refetch();
  }, [queryClient, refetch]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: JOBS_KEY });
  }, [queryClient]);

  const value = useMemo(() => ({
    jobs,
    loading,
    error,
    fetchJobs,
    addJob,
    updateJob,
    deleteJob,
    deleteJobs,
    refresh,
  }), [jobs, loading, error, fetchJobs, addJob, updateJob, deleteJob, deleteJobs, refresh]);

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
