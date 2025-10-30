# Lead Management System - Complete Implementation Guide

**Purpose**: Comprehensive implementation guide for ALL lead management features including modal consolidation, auto-schedule controls, expandable custom fields, and UI improvements. This document provides all code changes needed to implement the complete lead management system.

**Target Audience**: Claude sessions or developers implementing similar functionality

---

## Overview

This guide covers the complete lead management system implementation including:

### Core Features Implemented:
1. **Modal Consolidation** - Single modal for both create and edit operations
2. **Auto-Schedule Controls** - Pause/resume sales cycle functionality
3. **Expandable Custom Fields** - Click-to-expand with 2 fields shown by default
4. **Custom Confirmation Modal** - Replaced browser alerts with styled modals
5. **Modern Table Design** - Floating rows with no borders
6. **Terminology Updates** - "Sales Cycle" → "Auto-Schedule" throughout UI
7. **Code Optimization** - Removed redundant code and improved efficiency

---

## Part 1: Modal Consolidation

### Overview
Consolidate EditLeadModal into AddLeadModal to reduce code duplication (~300 lines saved) and improve maintainability.

### 1.1 Update AddLeadModal Component

**File**: `src/components/leads/AddLeadModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Agent, Lead, UpdateLeadRequest } from '@/types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: any) => void;
  agents: Agent[];
  isLoading?: boolean;
  mode?: 'create' | 'edit';  // ADD THIS
  lead?: Lead;               // ADD THIS
}

export function AddLeadModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
  isLoading,
  mode = 'create',  // DEFAULT TO CREATE
  lead               // EXISTING LEAD FOR EDIT MODE
}: AddLeadModalProps) {
  const [newLead, setNewLead] = useState({
    first_name: '',
    phone: '',
    agent_id: ''
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && lead && isOpen) {
      const initial = {
        first_name: lead.first_name,
        phone: lead.phone_e164,
        agent_id: lead.agent_id
      };
      setNewLead(initial);
      setVariableValues(lead.custom_fields || {});
      setHasChanges(false);
    } else if (mode === 'create' && isOpen) {
      // Auto-select single agent in create mode
      if (agents.length === 1 && !newLead.agent_id) {
        setNewLead(prev => ({ ...prev, agent_id: agents[0].id }));
      }
    }
  }, [lead, mode, isOpen, agents]);

  // Reset form only when modal closes in create mode (after successful submission)
  useEffect(() => {
    if (!isOpen && mode === 'create') {
      resetForm();
    }
  }, [isOpen, mode]);

  const resetForm = () => {
    setNewLead({
      first_name: '',
      phone: '',
      agent_id: ''
    });
    setVariableValues({});
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    if (mode === 'edit' && lead) {
      // For edit mode, only send changed fields
      const updates: UpdateLeadRequest = {};

      if (newLead.first_name !== lead.first_name) {
        updates.first_name = newLead.first_name;
      }

      if (newLead.phone !== lead.phone_e164) {
        updates.phone_e164 = newLead.phone;
      }

      if (newLead.agent_id !== lead.agent_id) {
        updates.agent_id = newLead.agent_id;
      }

      if (JSON.stringify(variableValues) !== JSON.stringify(lead.custom_fields || {})) {
        updates.custom_fields = variableValues;
      }

      onSubmit({ leadId: lead.id, updates });
    } else {
      // For create mode, send all data
      const leadData = {
        agent_id: newLead.agent_id,
        first_name: newLead.first_name,
        phone_e164: newLead.phone,
        custom_fields: variableValues,
      };

      onSubmit(leadData);
      // Don't reset form here - let parent handle it on success
    }
  };

  const handleClose = () => {
    // Don't allow closing while loading
    if (isLoading) return;

    // Check if we need to show confirmation
    const hasUserEnteredData = mode === 'create'
      ? (newLead.first_name || newLead.phone || (newLead.agent_id && agents.length > 1))
      : false;

    if ((mode === 'edit' && hasChanges) || hasUserEnteredData) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  // Track changes in edit mode
  const handleFieldChange = (field: string, value: string) => {
    setNewLead(prev => ({ ...prev, [field]: value }));
    if (mode === 'edit') {
      setHasChanges(true);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === 'edit' ? `Edit Lead - ${lead?.first_name}` : "Add New Lead"}
      >
        {/* Modal content... */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add Lead')}
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCloseConfirmation}
        onClose={() => setShowCloseConfirmation(false)}
        onConfirm={() => {
          setShowCloseConfirmation(false);
          onClose();
        }}
        title="Unsaved Changes"
        message={mode === 'edit'
          ? "You have unsaved changes. Are you sure you want to close?"
          : "You have entered data that will be lost. Are you sure you want to close?"}
        confirmText="Close Without Saving"
        cancelText="Keep Editing"
      />
    </>
  );
}
```

### 1.2 Update Leads Page to Use Consolidated Modal

**File**: `src/app/leads/page.tsx`

```typescript
// Remove EditLeadModal import
// import { EditLeadModal } from '@/components/leads/EditLeadModal';  // DELETE THIS

// Add state for editing
const [editingLead, setEditingLead] = useState<Lead | null>(null);

// Handler for edit
const handleEditLead = (lead: Lead) => {
  // Prevent editing while syncing
  if ((lead as any)._pending) {
    toast.error('Cannot edit lead while syncing. Please wait.');
    return;
  }
  setEditingLead(lead);
};

// Handler for update
const handleUpdateLead = (data: any) => {
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
};

// In JSX - Single modal for both create and edit
{showAddModal && (
  <AddLeadModal
    isOpen={showAddModal}
    onClose={() => setShowAddModal(false)}
    onSubmit={handleAddLead}
    agents={agents}
    isLoading={createLeadMutation.isPending}
    mode="create"
  />
)}

{editingLead && (
  <AddLeadModal
    isOpen={!!editingLead}
    onClose={() => setEditingLead(null)}
    onSubmit={handleUpdateLead}
    agents={agents}
    isLoading={updateLeadMutation.isPending}
    mode="edit"
    lead={editingLead}
  />
)}
```

### 1.3 Delete EditLeadModal Component

**Action**: Delete the entire file `src/components/leads/EditLeadModal.tsx` (no longer needed)

---

## Part 2: Custom Confirmation Modal

### Overview
Replace browser alerts with a reusable styled confirmation modal component.

### 2.1 Create ConfirmationModal Component

**File**: `src/components/ui/ConfirmationModal.tsx`

```typescript
'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'outline';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = 'outline'
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="py-4">
        <p className="text-gray-600">{message}</p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        {/* NOTE: Destructive action on left, safe action on right */}
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
        <Button
          variant="primary"
          onClick={onClose}
        >
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
}
```

---

## Part 3: Expandable Custom Fields

### Overview
Implement click-to-expand functionality for custom fields, showing only 2 by default.

### 3.1 Add Expandable State and Handler

**File**: `src/app/leads/page.tsx`

```typescript
// Add state for tracking expanded rows
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

// Toggle function
const toggleExpandRow = (leadId: string) => {
  setExpandedRows(prev => {
    const newExpanded = new Set(prev);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    return newExpanded;
  });
};
```

### 3.2 Update Custom Fields Display

**File**: `src/app/leads/page.tsx`

Add imports:
```typescript
import { ChevronDown, ChevronUp } from 'lucide-react';
```

In the table cell for custom fields:
```typescript
<TableCell className="text-center">
  {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 ? (
    <div
      className={`text-sm max-w-xs ${
        Object.entries(lead.custom_fields).length > 2
          ? 'cursor-pointer hover:bg-gray-50 rounded p-1'
          : ''
      }`}
      onClick={Object.entries(lead.custom_fields).length > 2
        ? () => toggleExpandRow(lead.id)
        : undefined}
    >
      {/* Show first 2 or all if expanded */}
      {Object.entries(lead.custom_fields)
        .slice(0, expandedRows.has(lead.id) ? undefined : 2)
        .map(([key, value]) => (
          <div key={key} className="text-gray-700">
            <span className="font-medium">{key}:</span> {value}
          </div>
        ))}

      {/* Show expand/collapse indicator */}
      {Object.entries(lead.custom_fields).length > 2 && (
        <div className="flex items-center justify-center mt-1 text-gray-500">
          {expandedRows.has(lead.id) ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span className="text-xs ml-1">Show less</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span className="text-xs ml-1">
                +{Object.entries(lead.custom_fields).length - 2} more
              </span>
            </>
          )}
        </div>
      )}
    </div>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</TableCell>
```

---

## Part 4: Auto-Schedule (Sales Cycle) Controls

### Overview
Implement pause/resume functionality for lead auto-scheduling with optimistic UI updates.

### 4.1 API Integration Layer

**File**: `src/lib/lead-api.ts`

```typescript
// Add to LeadResponse interface
interface LeadResponse {
  // ... existing fields ...

  // Sales cycle information
  sales_cycle_id?: string;
  sales_cycle_status?: 'active' | 'paused' | 'completed' | 'cancelled';
  sales_cycle_next_call?: string;
}

// Add these methods to LeadAPI class
static async pauseSalesCycle(leadId: string, accessToken: string): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/pause-sales-cycle`, {
    method: 'PUT',
    headers: this.getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to pause sales cycle');
  }

  const data = await response.json();
  return this.transformLeadResponse(data as LeadResponse);
}

static async resumeSalesCycle(leadId: string, accessToken: string): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/resume-sales-cycle`, {
    method: 'PUT',
    headers: this.getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to resume sales cycle');
  }

  const data = await response.json();
  return this.transformLeadResponse(data as LeadResponse);
}
```

### 4.2 React Query Hooks

**File**: `src/hooks/useLeads.ts`

```typescript
// Pause sales cycle mutation with optimistic updates
export function usePauseSalesCycle() {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadAPI.pauseSalesCycle(leadId, tokens?.access_token || ''),
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      // Snapshot the previous value
      const previousLeadData = queryClient.getQueryData(leadKeys.detail(leadId));
      const previousListsData = queryClient.getQueriesData({ queryKey: leadKeys.lists() });

      // Optimistically update to paused state
      queryClient.setQueryData(leadKeys.detail(leadId), (old: any) => {
        if (!old) return old;
        return { ...old, sales_cycle_status: 'paused' };
      });

      // Update in all list queries
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old;
        return {
          ...old,
          leads: old.leads.map((lead: any) =>
            lead.id === leadId ? { ...lead, sales_cycle_status: 'paused' } : lead
          )
        };
      });

      return { previousLeadData, previousListsData };
    },
    onError: (err, leadId, context) => {
      // Rollback on error
      if (context?.previousLeadData) {
        queryClient.setQueryData(leadKeys.detail(leadId), context.previousLeadData);
      }
      if (context?.previousListsData) {
        context.previousListsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    }
  });
}

// Resume sales cycle mutation with optimistic updates
export function useResumeSalesCycle() {
  const queryClient = useQueryClient();
  const { tokens } = useAuth();

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadAPI.resumeSalesCycle(leadId, tokens?.access_token || ''),
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      // Snapshot the previous value
      const previousLeadData = queryClient.getQueryData(leadKeys.detail(leadId));
      const previousListsData = queryClient.getQueriesData({ queryKey: leadKeys.lists() });

      // Optimistically update to active state
      queryClient.setQueryData(leadKeys.detail(leadId), (old: any) => {
        if (!old) return old;
        return { ...old, sales_cycle_status: 'active' };
      });

      // Update in all list queries
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old;
        return {
          ...old,
          leads: old.leads.map((lead: any) =>
            lead.id === leadId ? { ...lead, sales_cycle_status: 'active' } : lead
          )
        };
      });

      return { previousLeadData, previousListsData };
    },
    onError: (err, leadId, context) => {
      // Rollback on error
      if (context?.previousLeadData) {
        queryClient.setQueryData(leadKeys.detail(leadId), context.previousLeadData);
      }
      if (context?.previousListsData) {
        context.previousListsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    }
  });
}
```

### 4.3 UI Implementation

**File**: `src/app/leads/page.tsx`

Add imports:
```typescript
import { Pause, Play } from 'lucide-react';
import { usePauseSalesCycle, useResumeSalesCycle } from '@/hooks/useLeads';
```

Add mutation hooks:
```typescript
const pauseSalesCycleMutation = usePauseSalesCycle();
const resumeSalesCycleMutation = useResumeSalesCycle();
```

Add handlers:
```typescript
const handlePauseSalesCycle = (leadId: string) => {
  pauseSalesCycleMutation.mutate(leadId, {
    onSuccess: () => {
      toast.success('Auto-scheduling paused');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to pause auto-scheduling');
    }
  });
};

const handleResumeSalesCycle = (leadId: string) => {
  resumeSalesCycleMutation.mutate(leadId, {
    onSuccess: () => {
      toast.success('Auto-scheduling resumed');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to resume auto-scheduling');
    }
  });
};
```

---

## Part 5: Modern Table Design

### Overview
Implement floating row design with no borders and proper spacing.

### 5.1 Update Table Components

**File**: `src/components/ui/Table.tsx`

```typescript
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm border-separate', className)}
        style={{ borderSpacing: '0 3px' }}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('bg-white rounded-lg', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle first:rounded-l-lg last:rounded-r-lg [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

// Export all components...
```

---

## Part 6: UI Status Display Updates

### 6.1 Vertical Status Badges

**File**: `src/app/leads/page.tsx`

Replace the status cell with vertical stacking:
```typescript
<TableCell className="text-center">
  <div className="flex flex-col items-center space-y-1">
    {/* Primary Lead Status */}
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      getStatusColor(lead.status)
    }`}>
      {getStatusText(lead.status)}
    </span>

    {/* Auto-Schedule Status (renamed from Sales Cycle) */}
    {lead.sales_cycle_status && (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        lead.sales_cycle_status === 'active'
          ? 'bg-green-100 text-green-800'
          : lead.sales_cycle_status === 'paused'
          ? 'bg-yellow-100 text-yellow-800'
          : lead.sales_cycle_status === 'completed'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        Auto: {lead.sales_cycle_status.charAt(0).toUpperCase() + lead.sales_cycle_status.slice(1)}
      </span>
    )}
  </div>
</TableCell>
```

### 6.2 Icon-Only Action Buttons

**File**: `src/app/leads/page.tsx`

```typescript
<TableCell className="text-center">
  <div className="flex items-center justify-center space-x-2">
    {/* Edit button */}
    <button
      onClick={() => handleEditLead(lead)}
      disabled={isPending}
      className="p-1.5 rounded focus:outline-none hover:bg-gray-100"
      title="Edit lead"
    >
      <Edit2 className="h-4 w-4 text-gray-600" />
    </button>

    {/* Call button */}
    <button
      onClick={() => handleScheduleCall(lead.id)}
      disabled={isPending || lead.status === 'in_progress'}
      className="p-1.5 rounded focus:outline-none hover:bg-gray-100"
      title={lead.status === 'in_progress' ? 'Call in progress' : 'Schedule call'}
    >
      <Phone className={`h-4 w-4 ${
        lead.status === 'in_progress' ? 'text-gray-400' : 'text-blue-600'
      }`} />
    </button>

    {/* Visual separator */}
    <div className="w-px h-6 bg-gray-200 mx-1"></div>

    {/* Pause/Resume Auto-Schedule button */}
    {lead.sales_cycle_status &&
     lead.sales_cycle_status !== 'completed' &&
     lead.sales_cycle_status !== 'cancelled' && (
      <button
        onClick={() => lead.sales_cycle_status === 'active'
          ? handlePauseSalesCycle(lead.id)
          : handleResumeSalesCycle(lead.id)
        }
        disabled={isPending}
        className="p-1.5 rounded focus:outline-none hover:bg-gray-100"
        title={lead.sales_cycle_status === 'active'
          ? 'Pause auto-scheduling'
          : 'Resume auto-scheduling'}
      >
        {lead.sales_cycle_status === 'active' ? (
          <Pause className="h-4 w-4 text-yellow-600" />
        ) : (
          <Play className="h-4 w-4 text-green-600" />
        )}
      </button>
    )}

    {/* Stop button */}
    <button
      onClick={() => handleStopLead(lead.id)}
      disabled={isPending || lead.status === 'stopped'}
      className="p-1.5 rounded focus:outline-none hover:bg-gray-100"
      title="Stop lead"
    >
      <Square className="h-4 w-4 text-red-600" />
    </button>
  </div>
</TableCell>
```

---

## Part 7: Terminology Updates

### Overview
Replace all instances of "Sales Cycle" with "Auto-Schedule" in the UI for better user understanding.

### 7.1 Update All UI Text

**Throughout the codebase**, replace:
- "Sales Cycle" → "Auto-Schedule"
- "sales cycle" → "auto-scheduling"
- "Pause sales cycle" → "Pause auto-scheduling"
- "Resume sales cycle" → "Resume auto-scheduling"

Key files to update:
- `src/app/leads/page.tsx` - Button titles and toast messages
- `src/components/leads/AddLeadModal.tsx` - Section headers
- Any other UI components displaying sales cycle text

**Note**: Backend field names remain as `sales_cycle_*` for backward compatibility.

---

## Part 8: Code Cleanup

### Overview
Remove redundant code identified during code review.

### 8.1 Fix Data Format Handling

**File**: `src/app/leads/page.tsx`

```typescript
// BEFORE (redundant):
const handleUpdateLead = (data: any) => {
  const leadId = data.leadId;
  const updates = data.updates || data.leadData;  // data.leadData never exists
  // ...
}

// AFTER (clean):
const handleUpdateLead = (data: any) => {
  const leadId = data.leadId;
  const updates = data.updates;  // Only use data.updates
  // ...
}
```

### 8.2 Remove Redundant Variable

**File**: `src/app/leads/page.tsx`

```typescript
// DELETE this line:
const filteredLeads = leads;

// UPDATE the map to use 'leads' directly:
{leads.map((lead) => (
  // ...
))}
```

### 8.3 Remove Unnecessary Reassignment

**File**: `src/components/leads/AddLeadModal.tsx`

```typescript
// BEFORE:
const selectedAgent = agents.find((a) => a.id === newLead.agent_id);
const allAgentVariables: string[] = selectedAgent?.variables ? Object.keys(selectedAgent.variables) : [];
const agentVariables = allAgentVariables;  // DELETE THIS LINE

// Use allAgentVariables directly in the code:
{allAgentVariables.length > 0 && (
  // ...
  {allAgentVariables.map((variable) => (
    // ...
  ))}
)}
```

---

## Backend Implementation

### API Endpoints

**File**: `app/api/v1/endpoints/leads.py`

```python
@router.put("/{lead_id}/pause-sales-cycle")
async def pause_lead_sales_cycle(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_user_company)
):
    """Pause the sales cycle for a lead"""
    from app.models.sales_cycle import SalesCycle
    from app.services.sales_cycle_service import SalesCycleService

    # Verify lead ownership
    lead = db.query(Lead).join(Agent).filter(
        Lead.id == lead_id,
        Agent.company_id == company.id,
        Lead.is_deleted == False
    ).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Get the active sales cycle
    active_cycle = db.query(SalesCycle).filter(
        SalesCycle.lead_id == lead_id,
        SalesCycle.status == 'active'
    ).first()

    if not active_cycle:
        raise HTTPException(
            status_code=400,
            detail="No active sales cycle found for this lead"
        )

    # Pause the sales cycle
    updated_cycle = SalesCycleService.pause_sales_cycle(db, active_cycle.id)

    return {
        "message": "Sales cycle paused successfully",
        "cycle_id": str(updated_cycle.id),
        "status": updated_cycle.status
    }

@router.put("/{lead_id}/resume-sales-cycle")
async def resume_lead_sales_cycle(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company: Company = Depends(get_user_company)
):
    """Resume a paused sales cycle for a lead"""
    from app.models.sales_cycle import SalesCycle
    from app.services.sales_cycle_service import SalesCycleService

    # Verify lead ownership
    lead = db.query(Lead).join(Agent).filter(
        Lead.id == lead_id,
        Agent.company_id == company.id,
        Lead.is_deleted == False
    ).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Get the paused sales cycle
    paused_cycle = db.query(SalesCycle).filter(
        SalesCycle.lead_id == lead_id,
        SalesCycle.status == 'paused'
    ).first()

    if not paused_cycle:
        raise HTTPException(
            status_code=400,
            detail="No paused sales cycle found for this lead"
        )

    # Resume the sales cycle
    updated_cycle = SalesCycleService.resume_sales_cycle(db, paused_cycle.id)

    return {
        "message": "Sales cycle resumed successfully",
        "cycle_id": str(updated_cycle.id),
        "status": updated_cycle.status,
        "next_scheduled_call": updated_cycle.next_call_at.isoformat() if updated_cycle.next_call_at else None
    }
```

---

## Testing Checklist

### Frontend Tests
- [ ] Modal consolidation works for both create and edit modes
- [ ] Unsaved changes warning appears when appropriate
- [ ] Confirmation modal replaces browser alerts
- [ ] Custom fields expand/collapse correctly (show 2 by default)
- [ ] Pause/resume buttons appear for appropriate sales cycle states
- [ ] Optimistic updates work with proper rollback on error
- [ ] Toast notifications display correct messages
- [ ] Table has floating row design with no borders
- [ ] All "Sales Cycle" text replaced with "Auto-Schedule"
- [ ] No redundant code remains

### Backend Tests
- [ ] Pause endpoint returns 200 for active cycles
- [ ] Resume endpoint returns 200 for paused cycles
- [ ] Error handling for invalid states
- [ ] Proper lead ownership verification
- [ ] Database transactions are atomic

### Integration Tests
- [ ] Create lead → Edit lead → Save changes flow
- [ ] Start cycle → Pause → Resume flow
- [ ] Multiple users don't interfere with each other
- [ ] Real-time updates work across browser tabs

---

## Implementation Order

1. **Backend API** - Implement pause/resume endpoints
2. **Modal Consolidation** - Merge EditLeadModal into AddLeadModal
3. **Confirmation Modal** - Create reusable component
4. **API Integration** - Add frontend API methods
5. **React Hooks** - Implement mutations with optimistic updates
6. **UI Components** - Add expandable fields, status badges, action buttons
7. **Table Styling** - Apply modern floating row design
8. **Terminology** - Update all UI text from Sales Cycle to Auto-Schedule
9. **Code Cleanup** - Remove redundant code
10. **Testing** - Verify all functionality

---

**Document Version**: 2.0 (Complete)
**Last Updated**: December 2024
**Compatibility**: FastAPI + React Query + TypeScript + Tailwind CSS

---

## Quick Reference

### Key Components Modified:
- `AddLeadModal.tsx` - Consolidated to handle both create and edit
- `EditLeadModal.tsx` - DELETED (no longer needed)
- `ConfirmationModal.tsx` - NEW component for styled confirmations
- `Table.tsx` - Updated for floating row design
- `leads/page.tsx` - Major updates for all features
- `lead-api.ts` - Added pause/resume methods
- `useLeads.ts` - Added mutation hooks with optimistic updates

### Key Features:
1. Single modal for create/edit (mode prop)
2. Expandable custom fields (2 shown by default)
3. Custom confirmation dialogs
4. Pause/Resume auto-scheduling
5. Vertical status badges
6. Icon-only action buttons
7. Modern table design (no borders, floating rows)
8. "Sales Cycle" → "Auto-Schedule" terminology

### Visual Design:
- Icons: 16px (h-4 w-4), 6px padding (p-1.5)
- Status badges: Vertical stacking with 4px gap
- Table rows: 3px spacing, rounded corners
- Action buttons: Gray hover background
- Visual separator: 1px wide, 24px tall, gray-200