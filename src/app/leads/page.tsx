'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Lead, Agent } from '@/types';
import { Plus, Upload, Search, ChevronLeft, ChevronRight, Users, Filter } from 'lucide-react';
import { CSVAgentSelection } from '@/components/leads/CSVAgentSelection';
import { CSVUploadPreview } from '@/components/leads/CSVUploadPreview';
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { OTPVerificationModal } from '@/components/leads/OTPVerificationModal';
import { VerificationRequiredModal } from '@/components/leads/VerificationRequiredModal';
import { LeadTableRow } from '@/components/leads/LeadTableRow';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useLeads, useCreateLead, useUpdateLead, useScheduleCall, useStopLead, useRequestVerification, useVerifyLead, usePauseSalesCycle, useResumeSalesCycle } from '@/hooks/useLeads';
import { useAllAgents } from '@/hooks/useAgents';
import { useDemoStatus } from '@/hooks/useDemo';
import { useLeadsRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import toast from 'react-hot-toast';

export default function LeadsPage() {
  const [showAgentSelectionModal, setShowAgentSelectionModal] = useState(false);
  const [showUploadPreviewModal, setShowUploadPreviewModal] = useState(false);
  const [selectedAgentForImport, setSelectedAgentForImport] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'new' | 'in_progress' | 'done' | 'stopped' | 'all'>('all');
  // Agent-first loading: Load from localStorage or empty string
  const [agentFilter, setAgentFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('leads_selected_agent') || '';
    }
    return '';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [schedulingLeadId, setSchedulingLeadId] = useState<string | null>(null);
  const [verifyingLead, setVerifyingLead] = useState<{ id: string; verificationId: string; message: string; expiresIn: number } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showVerificationRequired, setShowVerificationRequired] = useState<{ leadId: string; phoneNumber: string } | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25); // Reduced from 100 for better performance

  // Use cached queries with pagination - only fetch when agent selected
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useLeads({
    status_filter: statusFilter === 'all' ? undefined : statusFilter,
    agent_id: agentFilter || undefined,
    search: searchTerm || undefined,
    per_page: pageSize,
    page
  }, { enabled: !!agentFilter });

  // Always fetch agents from global cache - no more lazy loading
  const { data: agentsData, isLoading: agentsLoading } = useAllAgents();
  const agents = useMemo(() => agentsData?.agents || [], [agentsData]);
  
  // Check if demo account
  const { data: demoStatus } = useDemoStatus();
  const isDemoAccount = demoStatus?.demo_mode || false;
  const requiresVerification = demoStatus?.verified_leads_only || false;

  // Enable refresh when user returns to tab
  useLeadsRefreshOnFocus(true);

  // Mutations
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const scheduleCallMutation = useScheduleCall();
  const stopLeadMutation = useStopLead();
  const requestVerificationMutation = useRequestVerification();
  const verifyLeadMutation = useVerifyLead();
  const pauseSalesCycleMutation = usePauseSalesCycle();
  const resumeSalesCycleMutation = useResumeSalesCycle();

  const leads = useMemo(() => leadsData?.leads || [], [leadsData]);
  const loading = leadsLoading || agentsLoading;
  const error = leadsError?.message || null;

  // Auto-select single agent on mount or when agents change
  useEffect(() => {
    if (agents.length === 1 && !agentFilter) {
      const singleAgentId = agents[0].id;
      setAgentFilter(singleAgentId);
      localStorage.setItem('leads_selected_agent', singleAgentId);
    }
  }, [agents, agentFilter]);

  // Clear localStorage on logout
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      // If access token is removed (logout), clear agent selection
      if (e.key === 'access_token' && e.newValue === null) {
        localStorage.removeItem('leads_selected_agent');
        setAgentFilter('');
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Handle agent filter change with localStorage sync
  const handleAgentChange = useCallback((newAgentId: string) => {
    setAgentFilter(newAgentId);
    if (newAgentId) {
      localStorage.setItem('leads_selected_agent', newAgentId);
    } else {
      localStorage.removeItem('leads_selected_agent');
    }
  }, []);

  // Track initial load completion
  useEffect(() => {
    if (!loading && leads.length >= 0 && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [loading, leads.length, hasInitiallyLoaded]);

  // Reset to first page when filters/search/pageSize change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, agentFilter, pageSize]);

  // Go back to page 1 if current page becomes empty after filtering
  useEffect(() => {
    if (!leadsLoading && page > 1 && leads.length === 0) {
      setPage(1);
    }
  }, [leadsLoading, leads.length, page]);

  // O(1) optimized agent mapping with memoization
  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((agent: Agent) => {
      map.set(agent.id, agent.name);
    });
    return map;
  }, [agents]);

  // Pagination helpers
  const totalItems = leadsData?.total ?? 0;
  const totalPages = typeof totalItems === 'number' ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const startItem = leads.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = leads.length > 0 ? (page - 1) * pageSize + leads.length : 0;
  const hasPrev = page > 1;
  const hasNext = totalPages ? page < totalPages : leads.length === pageSize;

  const goToPage = (p: number) => {
    const safe = Math.max(1, Math.floor(p));
    if (totalPages) {
      setPage(Math.min(safe, totalPages));
    } else {
      setPage(safe);
    }
  };


  const handleAddLead = useCallback((leadData: any) => {
    createLeadMutation.mutate(leadData, {
      onSuccess: () => {
        setShowAddModal(false);
        toast.success('Lead added successfully!')
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to add lead')
      }
    });
  }, [createLeadMutation]);


  // Helper function to check if agent uses VoiceBot provider
  const isVoiceBotAgent = useCallback((lead: Lead) => {
    // Check if it's a quick call
    if (lead.custom_fields && lead.custom_fields._quick_call === true) {
      return true;
    }

    // Find the agent
    const agent = agents.find(a => a.id === lead.agent_id);
    if (!agent) return false;

    // Check provider_metadata
    if (agent.provider_metadata && agent.provider_metadata.provider === 'voicebot') {
      return true;
    }

    // Check region (convention for VoiceBot agents)
    if (agent.region === 'internal_india' || agent.region === 'internal_us') {
      return true;
    }

    return false;
  }, [agents]);

  const handleScheduleCall = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return;

    // Check if verification is required
    if (isDemoAccount && requiresVerification && lead && !lead.is_verified) {
      // Show verification required popup first
      setShowVerificationRequired({ leadId, phoneNumber: lead.phone_e164 });
      return;
    }

    // If no verification required or already verified, schedule the call
    setSchedulingLeadId(leadId);
    scheduleCallMutation.mutate({ leadId }, {
      onSuccess: () => {
        setSchedulingLeadId(null);
        toast.success('Call scheduled successfully!')
      },
      onError: (error: any) => {
        setSchedulingLeadId(null);
        
        // Check if error is due to verification requirement
        if (error?.message?.includes('must be verified')) {
          // Request verification
          requestVerificationMutation.mutate(leadId, {
            onSuccess: (data) => {
              setVerifyingLead({
                id: leadId,
                verificationId: data.verification_id,
                message: data.message,
                expiresIn: data.expires_in_seconds
              });
              setVerificationError(null);
              toast('Phone verification required before calling', { icon: '📱' });
            },
            onError: (verifyError: any) => {
              toast.error(verifyError?.message || 'Failed to request verification');
            }
          });
        } else {
          const errorMessage = error?.message || 'Failed to schedule call';

          // Add appropriate icon based on error type
          if (errorMessage.includes('maximum call attempts')) {
            toast.error(errorMessage, { icon: '🚫' });
          } else if (errorMessage.includes('limit reached')) {
            toast.error(errorMessage, { icon: '⏰' });
          } else if (errorMessage.includes('in progress')) {
            toast.error(errorMessage, { icon: '📞' });
          } else {
            toast.error(errorMessage);
          }
        }
      }
    });
  }, [leads, isDemoAccount, requiresVerification, scheduleCallMutation, requestVerificationMutation]);

  const handleVerificationRequired = useCallback(() => {
    if (!showVerificationRequired) return;

    const leadId = showVerificationRequired.leadId;
    setShowVerificationRequired(null);

    // Request verification
    requestVerificationMutation.mutate(leadId, {
      onSuccess: (data) => {
        setVerifyingLead({
          id: leadId,
          verificationId: data.verification_id,
          message: data.message,
          expiresIn: data.expires_in_seconds
        });
        setVerificationError(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to request verification');
      }
    });
  }, [showVerificationRequired, requestVerificationMutation]);

  const handleVerifyOTP = useCallback(async (otp: string) => {
    if (!verifyingLead) return;
    
    await verifyLeadMutation.mutateAsync({
      leadId: verifyingLead.id,
      verificationId: verifyingLead.verificationId,
      otpCode: otp
    }, {
      onSuccess: () => {
        toast.success('Phone number verified successfully!');
        setVerifyingLead(null);
        setVerificationError(null);
        // Don't automatically schedule call - let user decide when to call
      },
      onError: (error: any) => {
        setVerificationError(error?.message || 'Verification failed');
        throw error; // Re-throw to be handled by modal
      }
    });
  }, [verifyingLead, verifyLeadMutation]);

  const handleStopLead = useCallback((leadId: string) => {
    stopLeadMutation.mutate({ leadId }, {
      onSuccess: () => {
        toast.success('Lead stopped successfully!')
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to stop lead')
      }
    });
  }, [stopLeadMutation]);

  const handleEditLead = useCallback((lead: Lead) => {
    // Check if lead is syncing (optimistic state)
    const isOptimistic = (lead as any)._optimistic;
    if (isOptimistic) {
      toast.error('Cannot edit lead while syncing. Please wait.');
      return;
    }
    setEditingLead(lead);
  }, []);

  const handleUpdateLead = useCallback((data: any) => {
    // Handle edit modal format
    const leadId = data.leadId;
    const updates = data.updates;
    updateLeadMutation.mutate({ leadId, leadData: updates }, {
      onSuccess: () => {
        setEditingLead(null);
        toast.success('Lead updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update lead');
      }
    });
  }, [updateLeadMutation]);

  const handlePauseSalesCycle = useCallback((leadId: string) => {
    pauseSalesCycleMutation.mutate(leadId, {
      onSuccess: () => {
        toast.success('Auto-scheduling paused');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to pause auto-scheduling');
      }
    });
  }, [pauseSalesCycleMutation]);

  const toggleExpandRow = useCallback((leadId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(leadId)) {
        newExpanded.delete(leadId);
      } else {
        newExpanded.add(leadId);
      }
      return newExpanded;
    });
  }, []);

  const handleResumeSalesCycle = useCallback((leadId: string) => {
    resumeSalesCycleMutation.mutate(leadId, {
      onSuccess: () => {
        toast.success('Auto-scheduling resumed');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to resume auto-scheduling');
      }
    });
  }, [resumeSalesCycleMutation]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'stopped': return 'Stopped';
      default: return status;
    }
  }, []);

  if (loading && !hasInitiallyLoaded) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600">Manage your sales leads and contacts</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowAgentSelectionModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Agent Filter - First priority */}
            <div className="w-64">
              <CustomDropdown
                label="Agent"
                icon={<Users className="h-4 w-4" />}
                value={agentFilter}
                onChange={handleAgentChange}
                searchable={true}
                options={[
                  { value: '', label: 'Select an Agent' },
                  ...agents.map((agent: Agent) => ({
                    value: agent.id,
                    label: agent.name
                  }))
                ]}
              />
            </div>

            {/* Status Filter - Second priority */}
            <div className="w-48">
              <CustomDropdown
                label="Status"
                icon={<Filter className="h-4 w-4" />}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as 'new' | 'in_progress' | 'done' | 'stopped' | 'all')}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'new', label: 'New', icon: <span className="w-2 h-2 bg-blue-500 rounded-full" /> },
                  { value: 'in_progress', label: 'In Progress', icon: <span className="w-2 h-2 bg-yellow-500 rounded-full" /> },
                  { value: 'done', label: 'Done', icon: <span className="w-2 h-2 bg-green-500 rounded-full" /> },
                  { value: 'stopped', label: 'Stopped', icon: <span className="w-2 h-2 bg-red-500 rounded-full" /> }
                ]}
              />
            </div>

            {/* Search Bar - Third priority */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {leadsLoading && leads.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search leads by name, phone..."
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!agentFilter}
                />
              </div>
            </div>
          </div>


          <div className="bg-white rounded-lg shadow">
            {!agentFilter ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Please select an agent to view leads.</p>
              </div>
            ) : leadsLoading && !hasInitiallyLoaded ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No leads found. Create your first lead to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Name</TableHead>
                    <TableHead className="text-center">Phone</TableHead>
                    <TableHead className="text-center">Agent</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Attempts</TableHead>
                    <TableHead className="text-center">Custom Fields</TableHead>
                    <TableHead className="text-center">Scheduled</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <LeadTableRow
                      key={lead.id}
                      lead={lead}
                      agentMap={agentMap}
                      isDemoAccount={isDemoAccount}
                      requiresVerification={requiresVerification}
                      expandedRows={expandedRows}
                      schedulingLeadId={schedulingLeadId}
                      onEdit={handleEditLead}
                      onScheduleCall={handleScheduleCall}
                      onStopLead={handleStopLead}
                      onPauseSalesCycle={handlePauseSalesCycle}
                      onResumeSalesCycle={handleResumeSalesCycle}
                      onToggleExpand={toggleExpandRow}
                      onShowVerification={setShowVerificationRequired}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                      isPausingCycle={pauseSalesCycleMutation.isPending}
                      isResumingCycle={resumeSalesCycleMutation.isPending}
                      isStoppingLead={stopLeadMutation.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination footer (added) */}
            {leads.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  <span>Showing </span>
                  <span className="font-medium mx-1">{startItem}</span>
                  <span> to </span>
                  <span className="font-medium mx-1">{endItem}</span>
                  <span> of </span>
                  <span className="font-medium mx-1">{totalItems}</span>
                  <span> results</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* First Page */}
                  <Button variant="outline" onClick={() => goToPage(1)} disabled={!hasPrev} title="First page" size="sm">
                    <ChevronLeft className="h-4 w-4" /><ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>

                  {/* Previous Page */}
                  <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={!hasPrev} title="Previous page" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Info */}
                  <div className="px-3 text-sm">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </div>

                  {/* Next Page */}
                  <Button variant="outline" onClick={() => goToPage(page + 1)} disabled={!hasNext} title="Next page" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last Page */}
                  <Button variant="outline" onClick={() => goToPage(totalPages)} disabled={!hasNext} title="Last page" size="sm">
                    <ChevronRight className="h-4 w-4" /><ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>

                  {/* Page Size Selector */}
                  <div className="ml-3">
                    <CustomDropdown
                      options={[
                        { value: '10', label: '10 per page' },
                        { value: '25', label: '25 per page' },
                        { value: '50', label: '50 per page' },
                        { value: '100', label: '100 per page' }
                      ]}
                      value={pageSize.toString()}
                      onChange={(value) => setPageSize(Number(value))}
                      className="w-36"
                      forceUpward={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CSVAgentSelection
          isOpen={showAgentSelectionModal}
          onClose={() => {
            setShowAgentSelectionModal(false);
            setSelectedAgentForImport('');
          }}
          agents={agents}
          onUploadClick={(agentId) => {
            setSelectedAgentForImport(agentId);
            setShowAgentSelectionModal(false);
            setShowUploadPreviewModal(true);
          }}
          preselectedAgentId={agentFilter}
        />

        <CSVUploadPreview
          isOpen={showUploadPreviewModal}
          onClose={() => {
            setShowUploadPreviewModal(false);
            setSelectedAgentForImport('');
          }}
          agentId={selectedAgentForImport}
          agents={agents}
          onImport={() => {
            setShowUploadPreviewModal(false);
            setSelectedAgentForImport('');
          }}
        />

        <AddLeadModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLead}
          agents={agents}
          isLoading={createLeadMutation.isPending}
          mode="create"
          preselectedAgentId={agentFilter}
        />

        {editingLead && (
          <AddLeadModal
            isOpen={true}
            onClose={() => setEditingLead(null)}
            onSubmit={handleUpdateLead}
            agents={agents}
            isLoading={updateLeadMutation.isPending}
            mode="edit"
            lead={editingLead}
          />
        )}
        
        {showVerificationRequired && (
          <VerificationRequiredModal
            isOpen={true}
            onClose={() => setShowVerificationRequired(null)}
            phoneNumber={showVerificationRequired.phoneNumber}
            onVerify={handleVerificationRequired}
          />
        )}
        
        {verifyingLead && (
          <OTPVerificationModal
            isOpen={true}
            onClose={() => {
              setVerifyingLead(null);
              setVerificationError(null);
            }}
            message={verifyingLead.message}
            expiresIn={verifyingLead.expiresIn}
            onSubmit={handleVerifyOTP}
            isLoading={verifyLeadMutation.isPending}
            error={verificationError}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}