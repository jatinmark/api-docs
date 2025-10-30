'use client';

import React, { useState } from 'react';
import { TimelineMoment } from '@/types/calliq';

interface KeyMomentsTimelineProps {
  timeline: TimelineMoment[] | undefined;
  duration: number;
  currentTime?: number;
  onTimestampClick: (timestamp: string, timestampSeconds: number) => void;
  className?: string;
}

// Helper function to parse MM:SS to seconds
const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const [minutes, seconds] = parts.map(Number);
  return minutes * 60 + seconds;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getMomentColor = (type: string): string => {
  switch (type) {
    case 'pricing': return 'bg-green-500 hover:bg-green-600';
    case 'objection': return 'bg-orange-500 hover:bg-orange-600';
    case 'competitor': return 'bg-purple-500 hover:bg-purple-600';
    case 'pain_point': return 'bg-red-500 hover:bg-red-600';
    case 'next_steps': return 'bg-blue-500 hover:bg-blue-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getMomentLabel = (type: string): string => {
  switch (type) {
    case 'pricing': return 'Pricing Discussion';
    case 'objection': return 'Objection Raised';
    case 'competitor': return 'Competitor Mentioned';
    case 'pain_point': return 'Pain Point';
    case 'next_steps': return 'Next Steps';
    default: return 'Key Moment';
  }
};

export const KeyMomentsTimeline: React.FC<KeyMomentsTimelineProps> = ({ 
  timeline, 
  duration, 
  currentTime = 0,
  onTimestampClick, 
  className = '' 
}) => {
  const [hoveredMoment, setHoveredMoment] = useState<number | null>(null);

  if (!timeline || timeline.length === 0 || duration === 0) return null;

  const currentPosition = (currentTime / duration) * 100;

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Call Timeline - Key Moments</h4>
      
      {/* Timeline Track */}
      <div className="relative h-20 mb-2">
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
        
        {/* Progress indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${currentPosition}%` }}
        />
        
        {/* Current time indicator */}
        {currentTime > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg animate-pulse" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-blue-600 font-medium whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        )}
        
        {/* Moment markers */}
        {timeline.map((moment, index) => {
          const position = (parseTime(moment.time) / duration) * 100;
          const isHovered = hoveredMoment === index;
          
          return (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
              style={{ left: `${position}%` }}
              onMouseEnter={() => setHoveredMoment(index)}
              onMouseLeave={() => setHoveredMoment(null)}
              onClick={() => onTimestampClick(moment.time, parseTime(moment.time))}
            >
              {/* Marker dot */}
              <div className={`
                relative flex items-center justify-center
                w-10 h-10 -mt-4
                transition-all duration-200
                ${isHovered ? 'scale-125' : 'scale-100'}
              `}>
                <div className={`
                  absolute inset-0 rounded-full opacity-20
                  ${getMomentColor(moment.type)}
                  ${isHovered ? 'animate-ping' : ''}
                `} />
                <div className={`
                  relative w-8 h-8 rounded-full shadow-md
                  flex items-center justify-center
                  bg-white border-2
                  ${getMomentColor(moment.type).replace('bg-', 'border-')}
                `}>
                  <span className="text-lg">{moment.icon}</span>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2">
                <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
                  {moment.time}
                </div>
              </div>
              
              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{getMomentLabel(moment.type)}</div>
                    <div className="text-gray-300 mt-1">Click to jump to {moment.time}</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Time labels */}
      <div className="relative h-6 text-xs text-gray-500">
        <div className="absolute left-0">0:00</div>
        <div className="absolute right-0">{formatTime(duration)}</div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="text-gray-600">Pricing</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚫</span>
            <span className="text-gray-600">Objection</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚔️</span>
            <span className="text-gray-600">Competitor</span>
          </div>
          <div className="flex items-center gap-1">
            <span>😰</span>
            <span className="text-gray-600">Pain Point</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span className="text-gray-600">Next Steps</span>
          </div>
        </div>
      </div>
    </div>
  );
};