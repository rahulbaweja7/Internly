import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useJobActions } from './useJobActions';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../contexts/DataContext', () => ({ useData: jest.fn() }));

let dataFns;

const renderActions = (opts = {}) => {
  const setters = {
    selectedJobs: new Set(),
    setSelectedJobs: jest.fn(),
    setIsSelectionMode: jest.fn(),
    setIsBulkDeleteDialogOpen: jest.fn(),
    setIsDeleteAllDialogOpen: jest.fn(),
    setIsFormOpen: jest.fn(),
    setEditingInternship: jest.fn(),
    ...opts,
  };
  const { result } = renderHook(() => useJobActions(setters));
  return { result, setters };
};

beforeEach(() => {
  jest.clearAllMocks();
  dataFns = { addJob: jest.fn(), deleteJob: jest.fn(), deleteJobs: jest.fn(), refresh: jest.fn() };
  useData.mockReturnValue(dataFns);
});

describe('useJobActions', () => {
  it('handleAddInternship posts, updates cache, closes form, toasts success', async () => {
    axios.post.mockResolvedValue({ data: { _id: 'new1', company: 'Acme' } });
    const { result, setters } = renderActions();

    await act(async () => { await result.current.handleAddInternship({ company: 'Acme' }); });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs'),
      { company: 'Acme' },
      expect.objectContaining({ withCredentials: true })
    );
    expect(dataFns.addJob).toHaveBeenCalledWith({ _id: 'new1', company: 'Acme' });
    expect(setters.setIsFormOpen).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith('Job added');
  });

  it('handleAddInternship toasts error and does not touch cache on failure', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    const { result } = renderActions();

    await act(async () => { await result.current.handleAddInternship({ company: 'Acme' }); });

    expect(dataFns.addJob).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Failed to add job. Please try again.');
  });

  it('handleEditInternship maps form fields to the API payload', async () => {
    axios.put.mockResolvedValue({});
    const { result, setters } = renderActions();

    await act(async () => {
      await result.current.handleEditInternship({
        _id: 'j1', company: 'Acme', position: 'SWE', location: 'NYC',
        status: 'Applied', salary: '$5k', appliedDate: '2024-01-01', notes: 'hi',
      });
    });

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs/j1'),
      expect.objectContaining({ role: 'SWE', stipend: '$5k', dateApplied: '2024-01-01', interviewDate: null })
    );
    expect(setters.setEditingInternship).toHaveBeenCalledWith(null);
    expect(toast.success).toHaveBeenCalledWith('Job updated');
  });

  it('handleDeleteInternship deletes, removes from cache + selection, toasts', async () => {
    axios.delete.mockResolvedValue({});
    const { result } = renderActions();

    await act(async () => { await result.current.handleDeleteInternship('j9'); });

    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/jobs/j9'));
    expect(dataFns.deleteJob).toHaveBeenCalledWith('j9');
    expect(toast.success).toHaveBeenCalledWith('Job deleted');
  });

  it('handleBulkDelete deletes each selected id and clears selection', async () => {
    axios.delete.mockResolvedValue({});
    const { result, setters } = renderActions({ selectedJobs: new Set(['a', 'b']) });

    await act(async () => { await result.current.handleBulkDelete(); });

    expect(axios.delete).toHaveBeenCalledTimes(2);
    expect(dataFns.deleteJobs).toHaveBeenCalledWith(['a', 'b']);
    expect(setters.setIsSelectionMode).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith('Deleted 2 jobs');
  });

  it('handleDeleteAll confirms, refreshes, and surfaces the server message on failure', async () => {
    axios.delete.mockResolvedValueOnce({});
    const { result } = renderActions();
    await act(async () => { await result.current.handleDeleteAll(); });
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs/delete-all'),
      expect.objectContaining({ data: { confirm: 'delete-all' } })
    );
    expect(dataFns.refresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('All jobs deleted');

    jest.clearAllMocks();
    useData.mockReturnValue(dataFns);
    axios.delete.mockRejectedValueOnce({ response: { data: { message: 'Too many delete requests' } } });
    const { result: r2 } = renderActions();
    await act(async () => { await r2.current.handleDeleteAll(); });
    expect(toast.error).toHaveBeenCalledWith('Too many delete requests');
  });

  it('handleDeleteEmail hits the gmail endpoint', async () => {
    axios.delete.mockResolvedValue({});
    const { result } = renderActions();
    await act(async () => { await result.current.handleDeleteEmail('email123'); });
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/gmail/delete-email/email123'));
    expect(toast.success).toHaveBeenCalledWith('Email deleted from Gmail');
  });
});
