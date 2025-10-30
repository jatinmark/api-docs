'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthStorage } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, LogOut } from 'lucide-react';
import { logger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/support-access-constants';

export function SupportAccessBanner() {
  const { user } = useAuth();

  // Only show banner if server-side flag is set (invisible to supported company)
  const showBanner = user?.show_admin_banner === true;

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const exitSupportAccess = () => {
    try {
      // Get original super admin token from sessionStorage
      const originalToken = sessionStorage.getItem(STORAGE_KEYS.ORIGINAL_TOKEN);

      if (originalToken) {
        // Restore original token using AuthStorage
        AuthStorage.setTokens({
          access_token: originalToken,
          refresh_token: '',  // Not used but required by type
          expires_at: Date.now() + 86400000,  // 24 hours from now
          token_type: 'Bearer'
        });

        // Clear the support access tokens
        sessionStorage.removeItem(STORAGE_KEYS.ORIGINAL_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.COMPANY_NAME);

        // Redirect to super admin dashboard
        window.location.href = '/super-admin/dashboard';

        logger.info('Exited support access session');
      } else {
        // Fallback: clear everything and go to login
        handleLogout();
      }
    } catch (error) {
      logger.error('Error exiting support access:', error);
      // Fallback: clear everything and go to login
      handleLogout();
    }
  };

  // Only show banner if server-side flag indicates super admin viewing
  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-amber-100 border-l-4 border-amber-400 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Super Admin Mode: <span className="font-semibold">Company View</span>
            </p>
            <p className="text-xs text-amber-700">
              You are viewing a company dashboard with admin privileges
            </p>
          </div>
        </div>

        <Button
          onClick={exitSupportAccess}
          variant="outline"
          size="sm"
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit Support Access
        </Button>
      </div>
    </div>
  );
}