// Transform backend key_moments structure to match frontend expectations
export const transformKeyMoments = (backendKeyMoments: any) => {
  if (!backendKeyMoments || !backendKeyMoments.moments) return undefined;
  
  const { moments, summary, timeline_display } = backendKeyMoments;
  
  // Transform each moment type to include metadata
  const transformMomentSection = (momentArray: any[], type: string) => {
    if (!momentArray || momentArray.length === 0) return undefined;
    
    const icons: Record<string, string> = {
      pricing: '💰',
      objections: '🚫',
      competitors: '⚔️',
      pain_points: '😰',
      next_steps: '📅'
    };
    
    const labels: Record<string, string> = {
      pricing: 'Pricing Discussions',
      objections: 'Objections Raised',
      competitors: 'Competitor Mentions',
      pain_points: 'Pain Points',
      next_steps: 'Next Steps'
    };
    
    // Transform moments to match expected structure
    const transformedMoments = momentArray.map(moment => ({
      timestamp: moment.timestamp_formatted || `${Math.floor(moment.timestamp/60)}:${(moment.timestamp%60).toString().padStart(2,'0')}`,
      timestamp_seconds: moment.timestamp,
      text: moment.text,
      context: moment.context || '',
      speaker: moment.speaker as 'representative' | 'customer',
      addressed: moment.addressed,
      resolution: moment.resolution,
      competitor: moment.competitor,
      severity: moment.severity,
      specificity: moment.specificity,
      deadline: moment.deadline,
      commitment_level: moment.commitment_level,
      response: moment.response,  // Add sales rep's response
      business_impact: moment.business_impact  // Add business impact for pain points
    }));
    
    return {
      found: true,
      count: momentArray.length,
      moments: transformedMoments,
      icon: icons[type] || '📌',
      label: labels[type] || type,
      addressed_count: type === 'objections' ? momentArray.filter(m => m.addressed).length : undefined,
      unaddressed_count: type === 'objections' ? momentArray.filter(m => !m.addressed).length : undefined,
      competitor_names: type === 'competitors' ? Array.from(new Set(momentArray.map(m => m.competitor).filter(Boolean))) : undefined,
      clearly_defined: type === 'next_steps' ? momentArray.some(m => m.specificity === 'high') : undefined
    };
  };
  
  // Transform timeline display to expected format - use the time field directly
  const transformedTimeline = timeline_display?.map((item: any) => ({
    time: item.time || item.timestamp_formatted || `${Math.floor(item.timestamp/60)}:${(item.timestamp%60).toString().padStart(2,'0')}`,
    type: item.type,
    icon: item.icon
  })) || [];
  
  return {
    pricing: transformMomentSection(moments.pricing, 'pricing'),
    objections: transformMomentSection(moments.objections, 'objections'),
    competitors: transformMomentSection(moments.competitors, 'competitors'),
    pain_points: transformMomentSection(moments.pain_points, 'pain_points'),
    next_steps: transformMomentSection(moments.next_steps, 'next_steps'),
    timeline: transformedTimeline
  };
};