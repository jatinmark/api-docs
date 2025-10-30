'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeft,
  Users,
  Phone,
  TrendingUp,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { AuthStorage } from '@/lib/auth-storage';

interface CompanyDashboard {
  success: boolean;
  company: {
    id: string;
    name: string;
    admin_email: string;
    admin_name: string;
    created_at: string;
    is_demo_mode: boolean;
    account_stage: string;
  };
  stats: {
    total_agents: number;
    total_leads: number;
    total_calls: number;
    active_agents: number;
  };
  agents: Array<{
    id: string;
    name: string;
    status: string;
    prompt: string;
    voice_id: string | null;
    leads_count: number;
    calls_count: number;
    created_at: string;
    updated_at: string;
  }>;
  recent_activity: Array<{
    id: string;
    agent_name: string;
    lead_name: string;
    status: string;
    created_at: string;
  }>;
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CompanyDashboard | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const companyId = params?.id as string;

  useEffect(() => {
    // Only check role and fetch data after user is loaded
    if (user) {
      if (user.role !== 'super_admin') {
        toast.error('Access denied. Super admin privileges required.');
        router.push('/agents');
        return;
      }
      
      if (companyId) {
        fetchCompanyDashboard();
      }
    }
  }, [user, router, companyId]);

  const fetchCompanyDashboard = async () => {
    try {
      const tokens = AuthStorage.getTokens();
      if (!tokens) {
        // This shouldn't happen as ProtectedRoute ensures authentication
        logger.error('No tokens found in fetchCompanyDashboard');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/company/${companyId}/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied. Super admin privileges required.');
          router.push('/agents');
          return;
        }
        throw new Error('Failed to fetch company dashboard');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      logger.error('Failed to fetch company dashboard:', error);
      toast.error('Failed to load company dashboard');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.push('/super-admin/dashboard');
  };

  const togglePrompt = (agentId: string) => {
    setExpandedPrompts(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const truncatePrompt = (prompt: string, maxLength: number = 150) => {
    if (!prompt || prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength) + '...';
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 space-y-6">
          {loading ? (
            <>
              <div className="flex items-center space-x-4">
                <Button onClick={goBack} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
              </div>
              
              {/* Loading skeleton for stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <SkeletonCard key={i} />
                ))}
              </div>

              {/* Loading skeleton for agents */}
              <SkeletonList items={3} />
            </>
          ) : !data ? (
            <>
              <Button onClick={goBack} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="text-center py-12">
                <p className="text-gray-500">No data available</p>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button onClick={goBack} variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{data.company.name}</h1>
                    <p className="text-sm text-gray-500">
                      Admin: {data.company.admin_name || 'N/A'} ({data.company.admin_email})
                    </p>
                  </div>
                </div>
                {data.company.is_demo_mode && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Demo Mode
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Agents</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.stats.total_agents}
                      </p>
                    </div>
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.stats.total_leads}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Calls</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.stats.total_calls}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Agents</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.stats.active_agents}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Agents List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
                </div>
                
                <div className="divide-y">
                  {data.agents.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No agents found
                    </div>
                  ) : (
                    data.agents.map((agent) => {
                      const isExpanded = expandedPrompts[agent.id];
                      const hasPrompt = agent.prompt && agent.prompt.trim().length > 0;
                      const shouldShowToggle = hasPrompt && agent.prompt.length > 150;

                      return (
                        <div key={agent.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>

                              {/* Prompt Section */}
                              <div className="mt-2">
                                {hasPrompt ? (
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-500 whitespace-pre-wrap">
                                      {isExpanded ? agent.prompt : truncatePrompt(agent.prompt)}
                                    </div>
                                    {shouldShowToggle && (
                                      <button
                                        onClick={() => togglePrompt(agent.id)}
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            Show less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            Show more
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">No prompt set</p>
                                )}
                              </div>

                              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                                <span>{agent.calls_count} calls</span>
                                <span>•</span>
                                <span>{agent.leads_count} leads</span>
                                <span>•</span>
                                <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              agent.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {!data.recent_activity || data.recent_activity.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            No recent activity
                          </td>
                        </tr>
                      ) : (
                        data.recent_activity.map((activity) => (
                          <tr key={activity.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.agent_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.lead_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : activity.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {activity.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(activity.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}