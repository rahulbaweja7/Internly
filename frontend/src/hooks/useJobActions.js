import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';
import { useData } from '../contexts/DataContext';

/**
 * Encapsulates all job CRUD handlers so Dashboard.js stays thin.
 *
 * @param {{ selectedJobs: Set<string>, setSelectedJobs: Function, setIsSelectionMode: Function,
 *           setIsBulkDeleteDialogOpen: Function, setIsDeleteAllDialogOpen: Function,
 *           setIsFormOpen: Function, setEditingInternship: Function }} opts
 */
export function useJobActions({
  selectedJobs,
  setSelectedJobs,
  setIsSelectionMode,
  setIsBulkDeleteDialogOpen,
  setIsDeleteAllDialogOpen,
  setIsFormOpen,
  setEditingInternship,
}) {
  const { addJob, deleteJob, deleteJobs, refresh } = useData();
  const [deleting, setDeleting] = useState(false);

  const handleAddInternship = async (internshipData) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/jobs`, internshipData, {
        withCredentials: true,
      });
      addJob(response.data);
      setIsFormOpen(false);
      toast.success('Job added');
    } catch {
      toast.error('Failed to add job. Please try again.');
    }
  };

  const handleEditInternship = async (updatedInternship) => {
    try {
      await axios.put(`${config.API_BASE_URL}/api/jobs/${updatedInternship._id}`, {
        company: updatedInternship.company,
        role: updatedInternship.position,
        location: updatedInternship.location,
        status: updatedInternship.status,
        stipend: updatedInternship.salary,
        dateApplied: updatedInternship.appliedDate,
        interviewDate: updatedInternship.interviewDate || null,
        notes: updatedInternship.notes,
      });
      setEditingInternship(null);
      setIsFormOpen(false);
      toast.success('Job updated');
    } catch {
      toast.error('Failed to update job');
    }
  };

  const handleDeleteInternship = async (id) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`);
      deleteJob(id);
      setSelectedJobs((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const ids = Array.from(selectedJobs);
      await Promise.all(ids.map((id) => axios.delete(`${config.API_BASE_URL}/api/jobs/${id}`)));
      deleteJobs(ids);
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsBulkDeleteDialogOpen(false);
      toast.success(`Deleted ${ids.length} job${ids.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to delete some jobs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${config.API_BASE_URL}/api/jobs/delete-all`, {
        data: { confirm: 'delete-all' },
      });
      refresh();
      setSelectedJobs(new Set());
      setIsSelectionMode(false);
      setIsDeleteAllDialogOpen(false);
      toast.success('All jobs deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete all jobs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/gmail/delete-email/${emailId}`);
      toast.success('Email deleted from Gmail');
    } catch {
      toast.error('Failed to delete email from Gmail');
    }
  };

  return {
    deleting,
    handleAddInternship,
    handleEditInternship,
    handleDeleteInternship,
    handleBulkDelete,
    handleDeleteAll,
    handleDeleteEmail,
  };
}
