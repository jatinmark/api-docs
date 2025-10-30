/**
 * SuspenseBoundary Component
 * 
 * Enhanced Suspense wrapper with skeleton loader fallbacks.
 * Provides better loading experience for async components.
 */

'use client';

import React, { Suspense, SuspenseProps } from 'react';
import { 
  Skeleton,
  SkeletonCard, 
  SkeletonList, 
  SkeletonTable,
  SkeletonStats,
  SkeletonText
} from './SkeletonLoader';

interface SuspenseBoundaryProps extends Omit<SuspenseProps, 'fallback'> {
  fallback?: React.ReactNode;
  fallbackType?: 'card' | 'list' | 'table' | 'stats' | 'text' | 'custom';
  fallbackProps?: any;
  delay?: number;
}

export function SuspenseBoundary({ 
  children, 
  fallback,
  fallbackType = 'card',
  fallbackProps = {},
  delay = 0,
  ...suspenseProps
}: SuspenseBoundaryProps) {
  const [showFallback, setShowFallback] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // Select appropriate skeleton based on type
  const getFallback = () => {
    if (fallback) return fallback;
    if (!showFallback) return <div className="min-h-[200px]" />;

    switch (fallbackType) {
      case 'card':
        return <SkeletonCard {...fallbackProps} />;
      case 'list':
        return <SkeletonList {...fallbackProps} />;
      case 'table':
        return <SkeletonTable {...fallbackProps} />;
      case 'stats':
        return <SkeletonStats {...fallbackProps} />;
      case 'text':
        return <SkeletonText lines={3} {...fallbackProps} />;
      case 'custom':
        return <Skeleton className="h-64 w-full" {...fallbackProps} />;
      default:
        return <SkeletonCard {...fallbackProps} />;
    }
  };

  return (
    <Suspense fallback={getFallback()} {...suspenseProps}>
      {children}
    </Suspense>
  );
}

// Lazy loading wrapper with built-in suspense
export function LazyLoad<T extends React.ComponentType<any>>({
  loader,
  fallbackType = 'card',
  fallbackProps = {},
  delay = 0,
  ...props
}: {
  loader: () => Promise<{ default: T }>;
  fallbackType?: SuspenseBoundaryProps['fallbackType'];
  fallbackProps?: any;
  delay?: number;
} & React.ComponentProps<T>) {
  const LazyComponent = React.lazy(loader);

  return (
    <SuspenseBoundary 
      fallbackType={fallbackType}
      fallbackProps={fallbackProps}
      delay={delay}
    >
      <LazyComponent {...props} />
    </SuspenseBoundary>
  );
}

// Multiple suspense boundaries for nested loading
export function MultipleSuspenseBoundaries({
  children,
  boundaries
}: {
  children: React.ReactNode;
  boundaries: Array<{
    fallbackType?: SuspenseBoundaryProps['fallbackType'];
    fallbackProps?: any;
    delay?: number;
  }>;
}) {
  return boundaries.reduceRight(
    (acc, boundary) => (
      <SuspenseBoundary {...boundary}>
        {acc}
      </SuspenseBoundary>
    ),
    <>{children}</>
  ) as JSX.Element;
}