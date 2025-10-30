'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SuperAdminAPI } from '@/lib/super-admin-api';
import { AuthStorage } from '@/lib/auth-storage';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import {
  ContactSubmission,
  ContactSubmissionStatus,
  ContactSubmissionFilters
} from '@/types/contact-submission';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Calendar,
  Filter,
  X,
  Edit2,
  Save
} from 'lucide-react';

interface ContactQueriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Status badge styling
const statusStyles: Record<ContactSubmissionStatus, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  converted: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels: Record<ContactSubmissionStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  closed: 'Closed'
};

// Format date helper
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export function ContactQueriesModal({ isOpen, onClose }: ContactQueriesModalProps) {
  // State
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Editing state
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [savingNotes, setSavingNotes] = useState<number | null>(null);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const tokens = AuthStorage.getTokens();
      if (!tokens) {
        throw new Error('No authentication tokens found');
      }

      const params: any = {
        page,
        page_size: 15,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      if (statusFilter) params.status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await SuperAdminAPI.fetchContactSubmissions(
        tokens.access_token,
        params
      );

      setSubmissions(response.submissions);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      logger.error('Error fetching contact submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  // Fetch on mount and filter/page changes
  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen, fetchSubmissions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate]);

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: ContactSubmissionStatus) => {
    try {
      setUpdatingStatus(id);
      const tokens = AuthStorage.getTokens();
      if (!tokens) throw new Error('No authentication tokens found');

      await SuperAdminAPI.updateContactSubmission(
        id,
        { status: newStatus },
        tokens.access_token
      );

      // Update local state optimistically
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      );

      toast.success('Status updated successfully');
    } catch (error) {
      logger.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Toggle notes editing
  const toggleNotesEdit = (submission: ContactSubmission) => {
    if (editingNotesId === submission.id) {
      setEditingNotesId(null);
      setNotesText('');
    } else {
      setEditingNotesId(submission.id);
      setNotesText(submission.notes || '');
    }
  };

  // Save notes
  const saveNotes = async (id: number) => {
    try {
      setSavingNotes(id);
      const tokens = AuthStorage.getTokens();
      if (!tokens) throw new Error('No authentication tokens found');

      await SuperAdminAPI.updateContactSubmission(
        id,
        { notes: notesText },
        tokens.access_token
      );

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, notes: notesText } : sub
        )
      );

      setEditingNotesId(null);
      setNotesText('');
      toast.success('Notes saved successfully');
    } catch (error) {
      logger.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(null);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = statusFilter || startDate || endDate;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Queries" size="2xl">
      {/* Filters Section */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium transition-colors"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Showing {submissions.length} of {total} submissions
        </div>
      </div>

      {/* Table Section */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No submissions found</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">IP Address</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.name || 'N/A'}
                        </div>
                        {submission.message && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {submission.message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {submission.email}
                      {submission.phone && (
                        <div className="text-xs text-gray-500 mt-1">{submission.phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {submission.company || 'N/A'}
                      {submission.industry && (
                        <div className="text-xs text-gray-500 mt-1">{submission.industry}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 font-mono">
                      {submission.ip_address || 'N/A'}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {formatDate(submission.created_at)}
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={submission.status}
                        onChange={(e) =>
                          handleStatusChange(submission.id, e.target.value as ContactSubmissionStatus)
                        }
                        disabled={updatingStatus === submission.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          statusStyles[submission.status]
                        } ${updatingStatus === submission.id ? 'opacity-50' : ''}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => toggleNotesEdit(submission)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        {editingNotesId === submission.id ? 'Close' : 'Notes'}
                      </button>
                    </td>
                  </tr>
                  {editingNotesId === submission.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="py-4 px-2">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Internal Notes
                          </label>
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Add notes about this submission..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveNotes(submission.id)}
                              disabled={savingNotes === submission.id}
                              size="sm"
                              className="inline-flex items-center gap-1"
                            >
                              {savingNotes === submission.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Save Notes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => toggleNotesEdit(submission)}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Section */}
      {!loading && submissions.length > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
