'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Agent, Lead, UpdateLeadRequest } from '@/types';
import { toast } from 'react-hot-toast';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: any) => void;
  agents: Agent[];
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  lead?: Lead;
  preselectedAgentId?: string; // Pre-selected agent from parent
}

export function AddLeadModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
  isLoading,
  mode = 'create',
  lead,
  preselectedAgentId
}: AddLeadModalProps) {
  const [newLead, setNewLead] = useState({
    first_name: '',
    phone: '',
    agent_id: '',
    scheduled_date: '',
    scheduled_time: ''
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && lead && isOpen) {
      let scheduled_date = '';
      let scheduled_time = '';

      if (lead.schedule_at) {
        const scheduleDate = new Date(lead.schedule_at);
        // Use local date/time parts so we don't mix UTC date with local time
        const pad = (n: number) => n.toString().padStart(2, '0');
        scheduled_date = `${scheduleDate.getFullYear()}-${pad(scheduleDate.getMonth() + 1)}-${pad(scheduleDate.getDate())}`;
        scheduled_time = `${pad(scheduleDate.getHours())}:${pad(scheduleDate.getMinutes())}`;
      }

      const initial = {
        first_name: lead.first_name,
        phone: lead.phone_e164,
        agent_id: lead.agent_id,
        scheduled_date,
        scheduled_time
      };
      setNewLead(initial);
      setVariableValues(lead.custom_fields || {});
      setHasChanges(false);
    } else if (mode === 'create' && isOpen) {
      // Don't reset on open - keep data if there was an error
      // Pre-select agent from parent (e.g., currently selected in leads page)
      if (preselectedAgentId && !newLead.agent_id) {
        setNewLead(prev => ({ ...prev, agent_id: preselectedAgentId }));
      }
      // Auto-select single agent in create mode
      else if (agents.length === 1 && !newLead.agent_id) {
        setNewLead(prev => ({ ...prev, agent_id: agents[0].id }));
      }
    }
  }, [lead, mode, isOpen, agents, newLead.agent_id, preselectedAgentId]);

  // Reset form only when modal closes in create mode (after successful submission)
  useEffect(() => {
    if (!isOpen && mode === 'create') {
      // Reset form when modal closes (which happens only on success)
      resetForm();
    }
  }, [isOpen, mode]);

  // Get selected agent's variables
  const selectedAgent = agents.find((a) => a.id === newLead.agent_id);
  const allAgentVariables: string[] = selectedAgent?.variables ? Object.keys(selectedAgent.variables) : [];

  // Helper function to get agent's business hours
  const getAgentBusinessHours = () => {
    if (!selectedAgent || !selectedAgent.business_hours_start || !selectedAgent.business_hours_end) {
      // Default to 9 AM - 6 PM if not configured
      return { start: 9, end: 18, startStr: '09:00', endStr: '18:00' };
    }

    // Parse hours from "HH:MM" format
    const startHour = parseInt(selectedAgent.business_hours_start.split(':')[0], 10);
    const endHour = parseInt(selectedAgent.business_hours_end.split(':')[0], 10);

    // Format for 24-hour display
    const formatHour24 = (hour: number) => {
      return `${hour.toString().padStart(2, '0')}:00`;
    };

    return {
      start: startHour,
      end: endHour,
      startStr: formatHour24(startHour),
      endStr: formatHour24(endHour)
    };
  };

  // Phone number validation
  const isValidPhone = (phone: string): boolean => {
    if (!phone) return false;

    // Basic validation patterns for major countries (India first)
    const patterns = {
      '+91': /^\+91[6-9]\d{9}$/,    // India: +91 + 10 digits starting with 6-9
      '+1': /^\+1[2-9]\d{9}$/,     // US/Canada: +1 + 10 digits starting with 2-9
      '+44': /^\+44[1-9]\d{8,9}$/,  // UK: +44 + 9-10 digits
    };
    
    // Check if phone starts with any known pattern
    for (const [code, pattern] of Object.entries(patterns)) {
      if (phone.startsWith(code)) {
        return pattern.test(phone);
      }
    }
    
    // Basic fallback validation: + followed by 7-15 digits
    return /^\+\d{7,15}$/.test(phone);
  };

  const isFormValid = () => {
    return (
      newLead.first_name.trim() !== '' &&
      newLead.agent_id !== '' &&
      newLead.phone.trim() !== '' &&
      isValidPhone(newLead.phone)
    );
  };

  const resetForm = () => {
    setNewLead({
      first_name: '',
      phone: '',
      agent_id: '',
      scheduled_date: '',
      scheduled_time: ''
    });
    setVariableValues({});
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    // Combine date and time if both are set
    let scheduled_at: string | undefined;
    if (newLead.scheduled_date && newLead.scheduled_time) {
      scheduled_at = `${newLead.scheduled_date}T${newLead.scheduled_time}`;
    } else if (newLead.scheduled_date || newLead.scheduled_time) {
      toast.error('Please select both date and time, or leave both empty.');
      return;
    }

    // Validate business hours if schedule_at is set
    if (scheduled_at) {
      const scheduledTime = new Date(scheduled_at);
      const hours = scheduledTime.getHours();
      const businessHours = getAgentBusinessHours();

      if (hours < businessHours.start || hours >= businessHours.end) {
        toast.error(`Cannot schedule calls outside business hours (${businessHours.startStr} - ${businessHours.endStr}). Please adjust the time.`);
        return;
      }
    }

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

      // Check if scheduled_at has changed
      const originalDate = lead.schedule_at ? (() => {
        const d = new Date(lead.schedule_at);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      })() : '';

      const originalTime = lead.schedule_at ? (() => {
        const d = new Date(lead.schedule_at);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })() : '';

      if (newLead.scheduled_date !== originalDate || newLead.scheduled_time !== originalTime) {
        if (newLead.scheduled_date && newLead.scheduled_time) {
          const scheduled_at = `${newLead.scheduled_date}T${newLead.scheduled_time}`;
          updates.schedule_at = new Date(scheduled_at).toISOString();
        } else {
          updates.schedule_at = undefined;
        }
      }

      if (JSON.stringify(variableValues) !== JSON.stringify(lead.custom_fields || {})) {
        updates.custom_fields = variableValues;
      }

      onSubmit({ leadId: lead.id, updates });
    } else {
      // For create mode, send all data
      const scheduled_at = (newLead.scheduled_date && newLead.scheduled_time)
        ? `${newLead.scheduled_date}T${newLead.scheduled_time}`
        : undefined;

      const leadData = {
        agent_id: newLead.agent_id,
        first_name: newLead.first_name,
        phone_e164: newLead.phone,
        schedule_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
        custom_fields: {
          // Include all agent variables
          ...allAgentVariables.reduce((acc, key) => {
            acc[key] = variableValues[key] || '';
            return acc;
          }, {} as Record<string, string>),
        },
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
      ? (newLead.first_name || newLead.phone || (newLead.agent_id && agents.length > 1)) // Don't count auto-selected single agent
      : false;

    if ((mode === 'edit' && hasChanges) || hasUserEnteredData) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  // Track changes in edit mode
  const handleFieldChange = (field: string, value: string) => {
    if (field === 'first_name' || field === 'phone' || field === 'scheduled_date' || field === 'scheduled_time') {
      setNewLead(prev => ({ ...prev, [field]: value }));
    } else if (field === 'agent_id') {
      setNewLead(prev => ({ ...prev, agent_id: value }));
      if (mode === 'edit') {
        // Clear custom fields when agent changes in edit mode
        setVariableValues({});
      }
    }

    if (mode === 'edit') {
      setHasChanges(true);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [variable]: value }));
    if (mode === 'edit') {
      setHasChanges(true);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'edit' ? `Edit Lead - ${lead?.first_name || ''}` : "Add New Lead"}
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Step 1: Agent Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Assign to Agent
          </label>
          {agents.length === 1 ? (
            <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-sm text-gray-600">Agent: </span>
              <span className="font-medium text-gray-900">{agents[0].name}</span>
            </div>
          ) : (
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={newLead.agent_id}
              onChange={(e) => handleFieldChange('agent_id', e.target.value)}
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Lead Details - Only show after agent is selected */}
        {newLead.agent_id && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="First Name"
                value={newLead.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
                placeholder="Enter first name"
              />
              <PhoneInput
                label="Phone Number"
                value={newLead.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                placeholder="Enter phone number"
              />
            </div>

            {/* Scheduled Date and Time fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Schedule Date (Optional)"
                    type="date"
                    value={newLead.scheduled_date}
                    disabled={!newLead.agent_id}
                    onChange={(e) => handleFieldChange('scheduled_date', e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Time (24-Hour Format)
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    value={newLead.scheduled_time || ''}
                    disabled={!newLead.agent_id || !newLead.scheduled_date}
                    onChange={(e) => {
                      handleFieldChange('scheduled_time', e.target.value);
                      
                      // Validate against business hours
                      if (e.target.value) {
                        const hour = parseInt(e.target.value.split(':')[0], 10);
                        const businessHours = getAgentBusinessHours();
                        if (hour < businessHours.start || hour >= businessHours.end) {
                          toast(`Please note: Calls can only be scheduled between ${businessHours.startStr} and ${businessHours.endStr}.`);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {!newLead.agent_id
                  ? 'Select an agent first to schedule a call'
                  : newLead.scheduled_date && !newLead.scheduled_time
                  ? 'Please select a time for the scheduled date'
                  : !newLead.scheduled_date && newLead.scheduled_time
                  ? 'Please select a date for the scheduled time'
                  : `Set a specific date and time for the initial call. Time is displayed in 24-hour format. If not set, the call will be made immediately during business hours (${getAgentBusinessHours().startStr} - ${getAgentBusinessHours().endStr}).`
                }
              </p>
            </div>

            {/* Agent variables as inputs */}
            {allAgentVariables.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Additional Information ({selectedAgent?.name})
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  {allAgentVariables.map((variable) => (
                    <Input
                      key={variable}
                      label={variable.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      value={variableValues[variable] || ""}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace(/_/g, " ")}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Cycle Status (read-only, edit mode only) */}
        {mode === 'edit' && lead?.sales_cycle_status && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Sales Cycle Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lead.sales_cycle_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : lead.sales_cycle_status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lead.sales_cycle_status.charAt(0).toUpperCase() + lead.sales_cycle_status.slice(1)}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading || (mode === 'edit' && !hasChanges)}
          >
            {isLoading
              ? (mode === 'edit' ? 'Saving...' : 'Adding Lead...')
              : (mode === 'edit' ? 'Save Changes' : 'Add Lead')
            }
          </Button>
        </div>
      </div>
    </Modal>

    <ConfirmationModal
      isOpen={showCloseConfirmation}
      onClose={() => setShowCloseConfirmation(false)}
      onConfirm={handleConfirmClose}
      title="Unsaved Changes"
      message={
        mode === 'edit'
          ? "You have unsaved changes. Are you sure you want to close without saving?"
          : "You have entered data that will be lost. Are you sure you want to close?"
      }
      confirmText="Close Without Saving"
      cancelText="Keep Editing"
      variant="warning"
    />
  </>
  );
}