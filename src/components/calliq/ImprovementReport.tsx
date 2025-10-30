'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { calliqAPI } from '@/lib/calliq-api';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, Wand2, Check, Star, Lightbulb, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RoleplaySession from '@/components/calliq/RoleplaySession';

interface ImprovementReportProps {
  callId: string;
  companyInfo?: string; // Company URL passed from parent component
}

interface CoachingSection {
  name: string;
  score: string | null;
  content: string;
  icon: typeof Star;
  color: string;
}

interface TranscriptVariation {
  title: string;
  description: string;
  content: string;
}

const CoachingReportDisplay: React.FC<{ reportData: { coachingReport: string }, markdownComponents: any }> = ({ reportData, markdownComponents }) => {
  // Just render the full report with markdown - simple and clean
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200/80 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Coaching Report</h3>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {reportData.coachingReport}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// Helper function to render text with bold markers (**text**)
const renderTextWithBold = (text: string) => {
  if (!text) return null;

  // Split by ** markers (captures both the delimiters and the text between them)
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    // If part starts and ends with **, it's bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and render as bold
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-bold text-gray-900">{boldText}</strong>;
    }
    // Otherwise, render as normal text
    return <span key={index}>{part}</span>;
  });
};


const ImprovementReport: React.FC<ImprovementReportProps> = ({ callId, companyInfo = '' }) => {
  const [reportData, setReportData] = useState<{ coachingReport: string; idealTranscripts?: string[] } | null>(null);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log received prop
  console.log('[ImprovementReport] Received companyInfo prop:', companyInfo);

  // REMOVED: All company URL input/fetch logic - now using prop from parent component

  const fetchAndSaveReport = useCallback(async (forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);

    // Do not clear the old report if we are regenerating, so it stays visible until the new one arrives.
    if (!forceRegenerate) {
        setReportData(null);
    }

    try {
      // API call now includes the forceRegenerate parameter
      console.log('Fetching report for callId and companyInfo:');
      console.log(callId);
      console.log(companyInfo);
      const response = await calliqAPI.getImprovementReport(callId, forceRegenerate, companyInfo);

      const coachingReport = response?.data?.coaching_report || response?.coaching_report;
      const idealTranscripts = response?.data?.ideal_transcripts || response?.ideal_transcripts || [];

      if (coachingReport) {
        setReportData({ coachingReport, idealTranscripts });
        setSelectedVariationIndex(0); // Reset to first variation
      } else {
        setError(response?.detail || 'Failed to find the coaching report in the API response.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while processing the report.');
    } finally {
      setLoading(false);
    }
  }, [callId, companyInfo]);

  const markdownComponents = useMemo(() => ({
    h1: ({...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4" {...props} />,
    h2: ({...props}) => <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
    h3: ({...props}) => <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-blue-200" {...props} />,
    h4: ({...props}) => {
      const content = props.children?.toString() || '';
      let bgColor = 'bg-blue-50';
      let borderColor = 'border-blue-200';
      let iconColor = 'text-blue-600';
      let Icon = Star;

      if (content.includes('Opening')) {
        bgColor = 'bg-blue-50';
        borderColor = 'border-blue-200';
        iconColor = 'text-blue-600';
        Icon = Star;
      } else if (content.includes('Objection')) {
        bgColor = 'bg-orange-50';
        borderColor = 'border-orange-200';
        iconColor = 'text-orange-600';
        Icon = Lightbulb;
      } else if (content.includes('Closing')) {
        bgColor = 'bg-green-50';
        borderColor = 'border-green-200';
        iconColor = 'text-green-600';
        Icon = Check;
      }

      return (
        <div className={`${bgColor} border-l-4 ${borderColor} p-4 rounded-r-lg mt-6 mb-4`}>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon className={`h-6 w-6 ${iconColor}`} />
            {props.children}
          </h4>
        </div>
      );
    },
    ul: ({...props}) => <ul className="space-y-3 ml-0" {...props} />,
    li: ({...props}) => {
      const content = props.children?.toString() || '';

      // Function to remove emoji from children recursively
      const removeEmoji = (children: any, emojiToRemove: string): any => {
        if (typeof children === 'string') {
          return children.replace(new RegExp(`${emojiToRemove}\\s*`, 'g'), '');
        }
        if (Array.isArray(children)) {
          return children.map(child => removeEmoji(child, emojiToRemove));
        }
        if (React.isValidElement(children)) {
          const element = children as React.ReactElement<{ children?: React.ReactNode }>;
          if (element.props.children) {
            return React.cloneElement(element, {
              ...element.props,
              children: removeEmoji(element.props.children, emojiToRemove)
            });
          }
        }
        return children;
      };

      if (content.includes('✅')) {
        const cleanContent = removeEmoji(props.children, '✅');
        return (
          <li className="flex items-start gap-3 list-none">
            <span className="text-green-600 text-xl flex-shrink-0 w-6 inline-flex justify-center">✅</span>
            <span className="flex-1 text-gray-700">{cleanContent}</span>
          </li>
        );
      } else if (content.includes('❌')) {
        const cleanContent = removeEmoji(props.children, '❌');
        return (
          <li className="flex items-start gap-3 list-none">
            <span className="text-red-600 text-xl flex-shrink-0 w-6 inline-flex justify-center">❌</span>
            <span className="flex-1 text-gray-700">{cleanContent}</span>
          </li>
        );
      } else {
        return (
          <li className="flex items-start gap-3 list-none">
            <span className="text-gray-400 text-xl flex-shrink-0 w-6 inline-flex justify-center">•</span>
            <span className="flex-1 text-gray-700">{props.children}</span>
          </li>
        );
      }
    },
    p: ({...props}) => <p className="text-base text-gray-700 leading-relaxed mb-3" {...props} />,
    strong: ({...props}) => <strong className="font-semibold text-gray-900" {...props} />,
  }), []);

  return (
    <div className="bg-gray-50/50 p-6 sm:p-8 rounded-2xl border border-gray-100/80 shadow-sm mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">AI Coaching Report</h2>
          <p className="text-gray-600 mt-1">
            Personalized feedback to enhance sales techniques and performance.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {companyInfo && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Company:</span> {companyInfo}
          </div>
        )}

        <Button
          onClick={() => fetchAndSaveReport(!!reportData)} // Pass true if report exists, false otherwise.
          disabled={loading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {!!reportData ? 'Regenerating...' : 'Generating...'}
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              {!!reportData ? 'Regenerate Report' : 'Generate Coaching Report'}
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-8 space-y-8"
          >
            <CoachingReportDisplay reportData={reportData} markdownComponents={markdownComponents} />

            {/* Ideal Transcript Section - Multiple Variations */}
            {reportData.idealTranscripts && reportData.idealTranscripts.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200/80 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-gray-900 text-2xl font-bold mb-2 flex items-center">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3 shadow-md">
                        <Lightbulb className="h-6 w-6 text-white" />
                      </div>
                      Ideal Transcript Variations
                    </h3>
                    <p className="text-gray-600 text-sm ml-14">
                      Multiple approaches showing different ways to handle the conversation optimally
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">{reportData.idealTranscripts.length} Variations</span>
                  </div>
                </div>

                {/* Variation Selector Tabs */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    {reportData.idealTranscripts.map((_, index) => {
                      const variationTitles = [
                        { title: 'Consultative & Empathetic', icon: '💬', activeClass: 'bg-blue-600 text-white shadow-lg', inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                        { title: 'Direct & Results-Oriented', icon: '🎯', activeClass: 'bg-green-600 text-white shadow-lg', inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                        { title: 'Educational & Advisory', icon: '🎓', activeClass: 'bg-purple-600 text-white shadow-lg', inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' }
                      ];
                      const variation = variationTitles[index] || { title: `Variation ${index + 1}`, icon: '📝', activeClass: 'bg-gray-600 text-white shadow-lg', inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' };

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedVariationIndex(index)}
                          className={`
                            flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                            ${selectedVariationIndex === index
                              ? `${variation.activeClass} scale-105`
                              : variation.inactiveClass
                            }
                          `}
                        >
                          <span className="text-lg">{variation.icon}</span>
                          <span>{variation.title}</span>
                          {selectedVariationIndex === index && (
                            <Check className="h-4 w-4 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Variation Description */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      {selectedVariationIndex === 0 && (
                        <><strong>Consultative & Empathetic Approach:</strong> Focus on building deep rapport through active listening, empathy statements, and consultative questioning. Best for customers who value relationship and trust.</>
                      )}
                      {selectedVariationIndex === 1 && (
                        <><strong>Direct & Results-Oriented Approach:</strong> Focus on efficiency, clear value propositions, and solution-focused communication. Best for customers who are busy and want quick, concrete information.</>
                      )}
                      {selectedVariationIndex === 2 && (
                        <><strong>Educational & Advisory Approach:</strong> Focus on educating the customer, demonstrating expertise, and providing detailed explanations. Best for customers who want to understand options thoroughly before deciding.</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Selected Variation Display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedVariationIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Conversation Flow - Variation {selectedVariationIndex + 1}
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-xs text-gray-600">Agent</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-600">Customer</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 space-y-4 max-h-[600px] overflow-y-auto">
                        {reportData.idealTranscripts[selectedVariationIndex].split('\n').map((line, index) => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return null;

                          // Detect speaker based on common patterns
                          const isAgent = trimmedLine.toLowerCase().startsWith('agent:') ||
                                         trimmedLine.toLowerCase().startsWith('sales rep:') ||
                                         trimmedLine.toLowerCase().startsWith('representative:');
                          const isCustomer = trimmedLine.toLowerCase().startsWith('customer:') ||
                                            trimmedLine.toLowerCase().startsWith('prospect:') ||
                                            trimmedLine.toLowerCase().startsWith('client:');

                          // Remove speaker label from text
                          let displayText = trimmedLine;
                          if (isAgent || isCustomer) {
                            displayText = trimmedLine.split(':').slice(1).join(':').trim();
                          }

                          if (isAgent) {
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="flex items-start gap-3"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                  <Phone className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-blue-200/50 shadow-sm">
                                  <div className="text-xs font-semibold text-blue-600 mb-1">Agent</div>
                                  <div className="text-gray-800 text-sm leading-relaxed">
                                    {renderTextWithBold(displayText)}
                                  </div>
                                </div>
                                <div className="w-12"></div>
                              </motion.div>
                            );
                          } else if (isCustomer) {
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="flex items-start gap-3 flex-row-reverse"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 bg-green-50 rounded-2xl rounded-tr-sm px-4 py-3 border border-green-200/50 shadow-sm">
                                  <div className="text-xs font-semibold text-green-600 mb-1 text-right">Customer</div>
                                  <div className="text-gray-800 text-sm leading-relaxed">
                                    {renderTextWithBold(displayText)}
                                  </div>
                                </div>
                                <div className="w-12"></div>
                              </motion.div>
                            );
                          } else {
                            // For lines without a clear speaker, show as neutral
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="flex justify-center"
                              >
                                <div className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                                  <div className="text-gray-600 text-xs italic">
                                    {renderTextWithBold(trimmedLine)}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 ml-14">
                      <Check className="h-3.5 w-3.5 text-blue-500" />
                      <span>This transcript demonstrates best practices for effective communication</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Roleplay Session Component */}
            {reportData.idealTranscripts && reportData.idealTranscripts.length > 0 && (
              <RoleplaySession callId={callId} />
            )}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-500"
            >
              <Check className="h-4 w-4" />
              <span>Report saved to agent&apos;s profile for future reference.</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImprovementReport;