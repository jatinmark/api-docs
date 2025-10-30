'use client';

import React, { useState } from 'react';
import { KeyMoments, KeyMomentSection } from '@/types/calliq';
import { DollarSign, XCircle, Swords, AlertTriangle, Calendar, TrendingUp, ChevronDown, ChevronUp, Play, CheckCircle } from 'lucide-react';

interface ActionItem {
  task: string;
  owner: string;
  priority?: 'high' | 'medium' | 'low';
}

interface KeyMomentsSummaryProps {
  keyMoments: KeyMoments | undefined;
  onTimestampClick?: (timestamp: string, timestampSeconds: number) => void;
  actionItems?: ActionItem[];
  className?: string;
}

export const KeyMomentsSummary: React.FC<KeyMomentsSummaryProps> = ({ keyMoments, onTimestampClick, actionItems, className = '' }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if (!keyMoments) return null;

  const toggleCard = (cardType: string) => {
    setExpandedCard(expandedCard === cardType ? null : cardType);
  };

  // Helper function to count moments with responses
  const countMomentsWithResponses = (section: KeyMomentSection | undefined) => {
    if (!section?.moments) return 0;
    return section.moments.filter(m => m.response && m.response.trim() !== '').length;
  };

  const renderMomentDetails = (section: KeyMomentSection | undefined, type: string) => {
    if (!section?.moments || section.moments.length === 0) return null;

    return (
      <div className="max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {section.moments.map((moment, index) => (
            <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTimestampClick) {
                    onTimestampClick(moment.timestamp, moment.timestamp_seconds);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Play className="w-3 h-3" />
                {moment.timestamp}
              </button>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="text-gray-600 uppercase font-medium text-xs">{moment.speaker}: </span>
                  <span className="text-gray-800">&quot;{moment.text}&quot;</span>
                </div>
                {moment.context && (
                  <p className="text-xs text-gray-500 italic mt-1">Context: {moment.context}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {moment.addressed !== undefined && (
                    <span className={`text-xs ${moment.addressed ? 'text-green-600' : 'text-orange-600'}`}>
                      {moment.addressed ? '✓ Addressed' : '⚠ Not addressed'}
                    </span>
                  )}
                  {moment.severity && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                      moment.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                      moment.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      moment.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {moment.severity}
                    </span>
                  )}
                  {moment.competitor && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      {moment.competitor}
                    </span>
                  )}
                </div>
                
                {/* Display Rep's Response */}
                {moment.response && moment.response.trim() !== '' && (
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          {type === 'objections' ? "Rep's Response:" : 
                           type === 'competitors' ? "How we positioned:" : 
                           type === 'pain_points' ? "Solution offered:" : 
                           "Response:"}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">&quot;{moment.response}&quot;</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Display business impact for pain points */}
                {moment.business_impact && moment.business_impact.trim() !== '' && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Business Impact:</span> {moment.business_impact}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActionItems = () => {
    if (!actionItems || actionItems.length === 0) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-3">Action Items</h5>
        <div className="space-y-3">
          {actionItems.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-start space-x-2">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{item.task}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{item.owner}</span>
                  {item.priority && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
        Key Moments
      </h3>
      
      <div className="space-y-4">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pricing */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer"
            onClick={() => (keyMoments.pricing?.count ?? 0) > 0 ? toggleCard('pricing') : null}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">💰</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-blue-600">
                    {keyMoments.pricing?.count || 0}
                  </span>
                  {(keyMoments.pricing?.count ?? 0) > 0 && (
                    expandedCard === 'pricing' ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">Pricing</div>
              <div className="text-xs text-gray-500 mt-1">
                {keyMoments.pricing?.found ? 'Discussed' : 'Not mentioned'}
              </div>
            </div>
          </div>
        
          {/* Objections */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer relative"
            onClick={() => (keyMoments.objections?.count ?? 0) > 0 ? toggleCard('objections') : null}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">🚫</span>
                <div className="text-right flex items-center gap-1">
                  <div>
                    <span className="text-lg font-bold text-orange-600">
                      {keyMoments.objections?.count || 0}
                    </span>
                    {keyMoments.objections?.count && keyMoments.objections.count > 0 && (
                      <div className="text-xs text-gray-500">
                        {keyMoments.objections?.addressed_count || 0}/{keyMoments.objections?.count} handled
                      </div>
                    )}
                  </div>
                  {(keyMoments.objections?.count ?? 0) > 0 && (
                    expandedCard === 'objections' ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">Objections</div>
              {keyMoments.objections?.unaddressed_count !== undefined && keyMoments.objections.unaddressed_count !== null && keyMoments.objections.unaddressed_count > 0 && (
                <div className="text-xs text-orange-600 mt-1 font-medium">
                  ⚠️ {keyMoments.objections.unaddressed_count} unaddressed
                </div>
              )}
              {countMomentsWithResponses(keyMoments.objections) > 0 && (
                <div className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {countMomentsWithResponses(keyMoments.objections)} responses
                </div>
              )}
            </div>
          </div>
        
          {/* Competitors */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer"
            onClick={() => (keyMoments.competitors?.count ?? 0) > 0 ? toggleCard('competitors') : null}
          >
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">⚔️</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-purple-600">
                  {keyMoments.competitors?.count || 0}
                </span>
                {(keyMoments.competitors?.count ?? 0) > 0 && (
                  expandedCard === 'competitors' ? 
                    <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Competitors</div>
            {keyMoments.competitors?.competitor_names && keyMoments.competitors.competitor_names.length > 0 && (
              <div className="text-xs text-gray-600 mt-1 truncate" title={keyMoments.competitors.competitor_names.join(', ')}>
                {keyMoments.competitors.competitor_names.join(', ')}
              </div>
            )}
            {countMomentsWithResponses(keyMoments.competitors) > 0 && (
              <div className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {countMomentsWithResponses(keyMoments.competitors)} positioned
              </div>
            )}
            </div>
          </div>
        
          {/* Pain Points */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer"
            onClick={() => (keyMoments.pain_points?.count ?? 0) > 0 ? toggleCard('pain_points') : null}
          >
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">😰</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-red-600">
                  {keyMoments.pain_points?.count || 0}
                </span>
                {(keyMoments.pain_points?.count ?? 0) > 0 && (
                  expandedCard === 'pain_points' ? 
                    <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Pain Points</div>
            <div className="text-xs text-gray-500 mt-1">
              {keyMoments.pain_points?.found ? 'Discovered' : 'Not identified'}
            </div>
            {countMomentsWithResponses(keyMoments.pain_points) > 0 && (
              <div className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {countMomentsWithResponses(keyMoments.pain_points)} solutions
              </div>
            )}
            </div>
          </div>
        
          {/* Next Steps */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer"
            onClick={() => (keyMoments.next_steps?.count ?? 0) > 0 ? toggleCard('next_steps') : null}
          >
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">📅</span>
              <div className="text-right flex items-center gap-1">
                <div>
                  {keyMoments.next_steps?.clearly_defined ? (
                    <span className="text-green-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-red-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                </div>
                {(keyMoments.next_steps?.count ?? 0) > 0 && (
                  expandedCard === 'next_steps' ? 
                    <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Next Steps</div>
            <div className={`text-xs mt-1 font-medium ${
              keyMoments.next_steps?.clearly_defined ? 'text-green-600' : 'text-red-600'
            }`}>
              {keyMoments.next_steps?.clearly_defined ? 'Clearly defined' : 'Not defined'}
            </div>
            </div>
          </div>
        </div>

        {/* Dropdown Details Section */}
        {expandedCard && (
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
              {expandedCard.replace('_', ' ')} Details
            </h4>
            {expandedCard === 'pricing' && renderMomentDetails(keyMoments.pricing, 'pricing')}
            {expandedCard === 'objections' && renderMomentDetails(keyMoments.objections, 'objections')}
            {expandedCard === 'competitors' && renderMomentDetails(keyMoments.competitors, 'competitors')}
            {expandedCard === 'pain_points' && renderMomentDetails(keyMoments.pain_points, 'pain_points')}
            {expandedCard === 'next_steps' && (
              <>
                {renderMomentDetails(keyMoments.next_steps, 'next_steps')}
                {renderActionItems()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};