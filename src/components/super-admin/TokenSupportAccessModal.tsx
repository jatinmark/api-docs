'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminAPI, TokenGenerateResponse } from '@/lib/super-admin-api';
import { AuthStorage } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logger } from '@/lib/logger';
import { Loader2, LogIn } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/support-access-constants';

interface TokenSupportAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Error display component to avoid duplication
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-3">
    <div className="flex">
      <div className="ml-3">
        <p className="text-sm text-red-800">{message}</p>
      </div>
    </div>
  </div>
);

export function TokenSupportAccessModal({ isOpen, onClose }: TokenSupportAccessModalProps) {
  const { tokens } = useAuth();
  const [companyId, setCompanyId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when opening/closing
  const handleClose = useCallback(() => {
    setCompanyId('');
    setError(null);
    onClose();
  }, [onClose]);

  // Generate token and login directly (simplified - one step)
  const generateTokenAndLogin = useCallback(async () => {
    if (!companyId.trim() || !tokens?.access_token) {
      setError('Company ID is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await SuperAdminAPI.generateCompanyToken(companyId.trim(), tokens.access_token);

      // Store backup tokens in sessionStorage (cleared on tab close)
      sessionStorage.setItem(STORAGE_KEYS.ORIGINAL_TOKEN, tokens.access_token);
      sessionStorage.setItem(STORAGE_KEYS.COMPANY_NAME, response.company_name);

      // Store the JWT access token directly
      AuthStorage.setTokens({
        access_token: response.access_token,
        refresh_token: '',
        expires_at: Date.now() + (response.expires_in * 1000),
        token_type: 'Bearer'
      });

      // Reload page to trigger auth context update
      window.location.href = '/';

      logger.info('Successfully accessed company account', {
        companyName: response.company_name,
        companyId: response.company_id
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate token';
      setError(errorMessage);
      logger.error('Token generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [companyId, tokens?.access_token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Company Support Access
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
                Company ID
              </label>
              <Input
                id="companyId"
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Enter company ID..."
                className="w-full"
                onKeyDown={(e) => e.key === 'Enter' && generateTokenAndLogin()}
              />
            </div>

            {error && <ErrorDisplay message={error} />}

            <Button
              onClick={generateTokenAndLogin}
              disabled={isGenerating || !companyId.trim()}
              className="w-full"
            >
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <LogIn className="w-4 h-4 mr-2" />
              Access Company
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}