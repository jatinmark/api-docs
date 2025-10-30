'use client';

import React, { useState } from 'react';
import { KeyMoments, KeyMomentSection } from '@/types/calliq';
import { Play, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface KeyMomentsListProps {
  keyMoments: KeyMoments | undefined;
  onTimestampClick: (timestamp: string, timestampSeconds: number) => void;
  className?: string;
}

const getSeverityClass = (severity?: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const KeyMomentsList: React.FC<KeyMomentsListProps> = ({ 
  keyMoments, 
  onTimestampClick, 
  className = '' 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['objections', 'pain_points']));

  if (!keyMoments) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderMomentSection = (type: string, data: KeyMomentSection | undefined) => {
    if (!data?.found || !data?.moments || data.moments.length === 0) return null;

    const isExpanded = expandedSections.has(type);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(type)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{data.icon}</span>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900">
                {data.label}
              </h4>
              <div className="text-xs text-gray-500">
                {data.count} moment{data.count !== 1 ? 's' : ''}
                {type === 'objections' && data.unaddressed_count && data.unaddressed_count > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ({data.unaddressed_count} unaddressed)
                  </span>
                )}
                {type === 'competitors' && data.competitor_names && (
                  <span className="ml-2">
                    - {data.competitor_names.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            {data.moments.map((moment, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {/* Timestamp button */}
                <button 
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                  onClick={() => onTimestampClick(moment.timestamp, moment.timestamp_seconds)}
                >
                  <Play className="w-3 h-3" />
                  {moment.timestamp}
                </button>
                
                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {moment.speaker}:
                    </span>
                    <p className="text-sm text-gray-800 flex-1">
                      &quot;{moment.text}&quot;
                    </p>
                  </div>
                  
                  {moment.context && (
                    <p className="text-xs text-gray-500 italic ml-14">
                      Context: {moment.context}
                    </p>
                  )}
                  
                  {/* Status indicators */}
                  <div className="flex items-center gap-2 ml-14">
                    {moment.addressed !== undefined && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        moment.addressed ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {moment.addressed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Addressed
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Not Addressed
                          </>
                        )}
                      </span>
                    )}
                    
                    {moment.resolution && (
                      <span className="text-xs text-gray-600">
                        → {moment.resolution}
                      </span>
                    )}
                    
                    {moment.competitor && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {moment.competitor}
                      </span>
                    )}
                    
                    {moment.severity && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${getSeverityClass(moment.severity)}`}>
                        {moment.severity}
                      </span>
                    )}
                    
                    {moment.deadline && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        📅 {moment.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Check if there are any moments to display
  const hasMoments = 
    (keyMoments.pricing?.found && keyMoments.pricing.moments?.length > 0) ||
    (keyMoments.objections?.found && keyMoments.objections.moments?.length > 0) ||
    (keyMoments.competitors?.found && keyMoments.competitors.moments?.length > 0) ||
    (keyMoments.pain_points?.found && keyMoments.pain_points.moments?.length > 0) ||
    (keyMoments.next_steps?.found && keyMoments.next_steps.moments?.length > 0);

  if (!hasMoments) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No key moments detected in this call</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Detailed Key Moments</h3>
      
      {renderMomentSection('pricing', keyMoments.pricing)}
      {renderMomentSection('objections', keyMoments.objections)}
      {renderMomentSection('competitors', keyMoments.competitors)}
      {renderMomentSection('pain_points', keyMoments.pain_points)}
      {renderMomentSection('next_steps', keyMoments.next_steps)}
    </div>
  );
};