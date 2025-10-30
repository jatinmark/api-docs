'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';
import { logger } from '@/lib/logger';

export default function CallIQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Show loading while auth is being verified
  if (isAuthLoading) {
    return (
      <Layout>
        <LoadingSpinner text="Verifying authentication..." />
      </Layout>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Only render children after auth is complete and verified
  return (
    <Layout>
      <LoadingProvider>
        <ErrorBoundary 
          onError={(error, errorInfo) => {
            logger.error('CallIQ Layout Error Boundary triggered', error, { errorInfo });
          }}
        >
          {children}
        </ErrorBoundary>
      </LoadingProvider>
    </Layout>
  );
}