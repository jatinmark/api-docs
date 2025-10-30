/**
 * SkeletonLoader Component
 * 
 * Reusable skeleton loading components with shimmer animation.
 * Provides better perceived performance by showing placeholders during data loading.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton component with shimmer animation
interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className, animate = true, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded-md',
        animate && 'animate-pulse',
        className
      )}
      style={style}
    />
  );
}

// Text skeleton - for paragraphs and headings
interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  width?: 'full' | 'three-quarters' | 'half' | 'quarter';
}

export function SkeletonText({ 
  lines = 1, 
  width = 'full',
  className,
  animate = true 
}: SkeletonTextProps) {
  const widthClasses = {
    'full': 'w-full',
    'three-quarters': 'w-3/4',
    'half': 'w-1/2',
    'quarter': 'w-1/4'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? widthClasses[width] : 'w-full'
          )}
          animate={animate}
        />
      ))}
    </div>
  );
}

// Card skeleton - for card-like components
interface SkeletonCardProps extends SkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({ 
  showAvatar = false,
  showActions = false,
  className,
  animate = true 
}: SkeletonCardProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" animate={animate} />
        )}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" animate={animate} />
            <SkeletonText lines={2} width="three-quarters" animate={animate} />
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" animate={animate} />
              <Skeleton className="h-8 w-20" animate={animate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Table skeleton - for table rows
interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function SkeletonTable({ 
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  animate = true 
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {showHeader && (
        <div className="flex space-x-4 pb-4 border-b border-gray-200 mb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 flex-1"
              animate={animate}
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  'h-12 flex-1',
                  colIndex === 0 && 'w-1/4',
                  colIndex === columns - 1 && 'w-1/6'
                )}
                animate={animate}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// List skeleton - for list items
interface SkeletonListProps extends SkeletonProps {
  items?: number;
  showIcon?: boolean;
  showSecondaryText?: boolean;
}

export function SkeletonList({ 
  items = 3,
  showIcon = false,
  showSecondaryText = false,
  className,
  animate = true 
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showIcon && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" animate={animate} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" animate={animate} />
            {showSecondaryText && (
              <Skeleton className="h-3 w-1/2" animate={animate} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats skeleton - for dashboard stats
interface SkeletonStatsProps extends SkeletonProps {
  cards?: number;
}

export function SkeletonStats({ 
  cards = 4,
  className,
  animate = true 
}: SkeletonStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" animate={animate} />
            <Skeleton className="h-8 w-3/4" animate={animate} />
            <Skeleton className="h-3 w-full" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Audio player skeleton
export function SkeletonAudioPlayer({ className, animate = true }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" animate={animate} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2 w-full" animate={animate} />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" animate={animate} />
              <Skeleton className="h-3 w-12" animate={animate} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" animate={animate} />
          <Skeleton className="h-10 w-10 rounded-full" animate={animate} />
          <Skeleton className="h-8 w-8 rounded-full" animate={animate} />
        </div>
      </div>
    </div>
  );
}

// Transcript skeleton
export function SkeletonTranscript({ className, animate = true }: SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" animate={animate} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" animate={animate} />
            <SkeletonText
              lines={2}
              width={i % 2 === 0 ? 'three-quarters' : 'full'}
              animate={animate}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart skeleton - for activity charts (call volume, company activity)
interface SkeletonChartProps extends SkeletonProps {
  height?: string;
  showLegend?: boolean;
}

export function SkeletonChart({
  height = 'h-80',
  showLegend = true,
  className,
  animate = true
}: SkeletonChartProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      {/* Chart header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" animate={animate} />
          <Skeleton className="h-3 w-48" animate={animate} />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" animate={animate} />
          <Skeleton className="h-8 w-8 rounded" animate={animate} />
        </div>
      </div>

      {/* Chart area with fake bars/lines */}
      <div className={cn('relative', height)}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" animate={animate} />
          ))}
        </div>

        {/* Chart bars */}
        <div className="ml-14 h-full flex items-end justify-between space-x-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
              animate={animate}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 mt-2 flex justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" animate={animate} />
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex items-center justify-center space-x-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" animate={animate} />
              <Skeleton className="h-3 w-16" animate={animate} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Realtime activity skeleton - for realtime stats card
export function SkeletonRealtimeActivity({ className, animate = true }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" animate={animate} />
          <Skeleton className="h-3 w-40" animate={animate} />
        </div>
        <Skeleton className="h-8 w-8 rounded" animate={animate} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" animate={animate} />
            <Skeleton className="h-8 w-16" animate={animate} />
          </div>
        ))}
      </div>

      {/* Recent activity list */}
      <div className="border-t pt-4">
        <Skeleton className="h-4 w-24 mb-3" animate={animate} />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" animate={animate} />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" animate={animate} />
                <Skeleton className="h-2 w-1/2" animate={animate} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}