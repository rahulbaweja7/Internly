import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

function Spinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

/**
 * @param {{ isBulkDeleteDialogOpen: boolean, setIsBulkDeleteDialogOpen: Function,
 *           isDeleteAllDialogOpen: boolean, setIsDeleteAllDialogOpen: Function,
 *           selectedCount: number, totalCount: number,
 *           deleting: boolean, onBulkDelete: Function, onDeleteAll: Function }} props
 */
export function DeleteDialogs({
  isBulkDeleteDialogOpen,
  setIsBulkDeleteDialogOpen,
  isDeleteAllDialogOpen,
  setIsDeleteAllDialogOpen,
  selectedCount,
  totalCount,
  deleting,
  onBulkDelete,
  onDeleteAll,
}) {
  return (
    <>
      {/* Bulk delete */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirm Bulk Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete{' '}
              <strong>{selectedCount} selected job{selectedCount !== 1 ? 's' : ''}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onBulkDelete} disabled={deleting} className="flex items-center gap-2">
                {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting…' : `Delete ${selectedCount} Job${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete all */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete All Internships
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning: This action cannot be undone
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      You are about to delete{' '}
                      <strong>all {totalCount} internship{totalCount !== 1 ? 's' : ''}</strong> from your account.
                      This will permanently remove all your application data, including:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All application records</li>
                      <li>Interview schedules</li>
                      <li>Notes and comments</li>
                      <li>Application history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDeleteAll} disabled={deleting} className="flex items-center gap-2">
                {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting…' : `Delete All ${totalCount} Internship${totalCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
