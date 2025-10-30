"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import {
  SkeletonCard,
  SkeletonList,
  SkeletonChart,
  SkeletonRealtimeActivity,
} from "@/components/ui/SkeletonLoader";
import { TokenSupportAccessModal } from "@/components/super-admin/TokenSupportAccessModal";
import { CreateCompanyModal } from "@/components/super-admin/CreateCompanyModal";
import { ContactQueriesModal } from "@/components/super-admin/ContactQueriesModal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import {
  Building2,
  Phone,
  ChevronRight,
  ChevronLeft,
  Eye,
  KeyRound,
  Shield,
  Calendar,
  Filter,
  X,
  ArrowUpDown,
  Clock,
  UserPlus,
  MessageSquare,
  Inbox,
  Users,
  Mail,
  UserCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";
// Agent-related imports removed as they are no longer used in this layout
import {
  CallVolumeTrendChart,
  // CompanyActivityChart, // Removed this chart as it was company-based
  RealtimeActivityIndicator,
} from "@/components/super-admin/Charts";
import {
  useSuperAdminDashboard,
  useActivityMetrics,
  useInvalidateSuperAdmin,
} from "@/hooks/useSuperAdmin";
import { useDebounce } from "@/hooks/useDebounce";

// New User interface based on the updated API response
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  auth_type: string;
  email_verified: boolean;
  created_at: string;
  company_name?: string;
  company_id?: string;
  company_account_stage?: string;
  company_is_demo?: boolean;
  company_count: number;
}

// ✅ Safe date formatter
const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? "Invalid date"
    : d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(",", "");
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // React Query hooks - fetches data from the (new) /dashboard endpoint
  const { data, isLoading, error, refetch } = useSuperAdminDashboard();
  const invalidateDashboard = useInvalidateSuperAdmin();

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showContactQueriesModal, setShowContactQueriesModal] = useState(false);

  // Chart states
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "7d"
  );
  const { data: activityData, isLoading: isLoadingActivity } =
    useActivityMetrics(selectedPeriod);

  // New state for search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Sorting and filtering states - UPDATED for Users
  const [sortBy, setSortBy] = useState<string>("created_desc"); // created_desc, created_asc, name_asc, name_desc, company_name_asc, company_name_desc, role_asc
  const [roleFilter, setRoleFilter] = useState<string>("all"); // all, super_admin, company_admin
  const [accountStageFilter, setAccountStageFilter] = useState<string[]>([]); // demo, trial, paid
  const [demoModeFilter, setDemoModeFilter] = useState<string>("all"); // all, demo_only, non_demo

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (user && user.role !== "super_admin") {
      toast.error("Access denied. Super admin privileges required.");
      router.push("/agents");
    }
  }, [user, router]);

  useEffect(() => {
    if (error) {
      logger.error("Failed to fetch super admin dashboard:", error);
      toast.error("Failed to load dashboard data");
    }
  }, [error]);

  const viewCompanyDashboard = (companyId: string) => {
    router.push(`/super-admin/company/${companyId}/dashboard`);
  };

  // Simple data accessors for charts (data is already transformed by the hook)
  const getCallVolumeTrends = () => activityData?.callVolumeTrends || [];

  const getRealtimeActivity = () =>
    activityData?.realtimeActivity || {
      callsLastHour: 0,
      activeAgents: 0,
      currentActiveCalls: 0,
      recentCalls: [],
    };

  // Handle period change from CallVolumeTrendChart
  const handlePeriodChange = (newPeriod: "7d" | "30d" | "90d") => {
    logger.info(`Period changed to: ${newPeriod}`);
    setSelectedPeriod(newPeriod); // React Query will auto-refetch
    toast.success("Charts refreshed");
  };

  // Clear all filters function - UPDATED
  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setAccountStageFilter([]);
    setDemoModeFilter("all");
    setSortBy("created_desc");
  };

  // Check if any filters are active - UPDATED
  const hasActiveFilters = () => {
    return (
      debouncedSearch !== "" ||
      roleFilter !== "all" ||
      accountStageFilter.length > 0 ||
      demoModeFilter !== "all"
    );
  };

  // Reset to page 1 when filters change - UPDATED
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    sortBy,
    roleFilter,
    accountStageFilter,
    demoModeFilter,
    pageSize,
  ]);

  const filteredAndSortedUsers = useMemo(() => {
    if (!data?.users) return [];

    // Filter users based on all criteria
    let filtered = data.users.filter((user: User) => {
      const searchMatch =
        debouncedSearch === "" ||
        (user.name || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (user.email || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (user.company_name || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());

      if (!searchMatch) return false;

      // Role filter
      if (roleFilter !== "all") {
        if (user.role !== roleFilter) return false;
      }

      // Account stage filter (for primary company)
      if (accountStageFilter.length > 0) {
        if (
          !user.company_account_stage ||
          !accountStageFilter.includes(user.company_account_stage)
        )
          return false;
      }

      // Demo mode filter (for primary company)
      if (demoModeFilter !== "all") {
        const userIsDemo = user.company_is_demo === true;
        if (demoModeFilter === "demo_only" && !userIsDemo) return false;
        if (demoModeFilter === "non_demo" && userIsDemo) return false;
      }

      return true;
    });

    // Sort users
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case "created_asc":
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "company_name_asc":
          return (a.company_name || "").localeCompare(b.company_name || "");
        case "company_name_desc":
          return (b.company_name || "").localeCompare(a.company_name || "");
        case "role_asc":
          return (a.role || "").localeCompare(b.role || "");
        default:
          return 0;
      }
    });
  }, [
    data?.users,
    debouncedSearch,
    sortBy,
    roleFilter,
    accountStageFilter,
    demoModeFilter,
  ]);

  // Calculate pagination metrics
  const totalFilteredUsers = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / pageSize));
  const startItem =
    totalFilteredUsers > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem =
    totalFilteredUsers > 0
      ? Math.min(currentPage * pageSize, totalFilteredUsers)
      : 0;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Memoized pagination - prevents re-slicing on every render
  const paginatedUsers = useMemo(
    () =>
      filteredAndSortedUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filteredAndSortedUsers, currentPage, pageSize]
  );

  // Navigation function
  const goToPage = (pageNum: number) => {
    const safePage = Math.max(1, Math.min(pageNum, totalPages));
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                Super Admin Dashboard
              </h1>

              {/* Loading skeleton for stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>

              {/* Loading skeleton for companies */}
              <SkeletonList items={5} />
            </>
          ) : !data ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
                <div className="text-sm text-gray-500">Viewing all users</div>
              </div>

              {/* Summary Stats and Support Access */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.summary.total_users}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Companies
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.summary.total_companies}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Calls Today
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {data.summary.total_calls_today}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last Hour: {getRealtimeActivity()?.callsLastHour || 0}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-orange-600" />
                  </div>
                </div>

                {/* Support Access Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-200/30 to-indigo-200/30 rounded-full -ml-8 -mb-8 blur-xl"></div>

                  <div className="p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        Admin
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Support Access
                    </p>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Securely access company dashboards
                    </p>

                    <button
                      onClick={() => setShowTokenModal(true)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg shadow hover:shadow-md transform transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Generate Token</span>
                    </button>
                  </div>
                </div>

                {/* Customer Queries Card */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full -ml-8 -mb-8 blur-xl"></div>

                  <div className="p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                        Queries
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Customer Queries
                    </p>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      View and manage website submissions
                    </p>

                    <button
                      onClick={() => setShowContactQueriesModal(true)}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg shadow hover:shadow-md transform transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <Inbox className="h-3.5 w-3.5" />
                      <span>View Queries</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Charts Section */}
              <div className="space-y-4">
                {/* Charts Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Activity Overview
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Showing {selectedPeriod} data</span>
                      <span>•</span>
                      <span>Auto-refreshes every 2 minutes</span>
                    </div>
                  </div>
                </div>

                {isLoadingActivity ? (
                  // Show chart skeletons while activity data loads
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <SkeletonChart />
                      </div>
                      <div className="lg:col-span-1">
                        <SkeletonRealtimeActivity />
                      </div>
                    </div>
                  </>
                ) : activityData ? (
                  // Show actual charts once data is loaded
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Call Volume Trends - Takes 2 columns */}
                      <div className="lg:col-span-2">
                        <CallVolumeTrendChart
                          data={getCallVolumeTrends()}
                          period={selectedPeriod}
                          onPeriodChange={handlePeriodChange}
                          onRefresh={refetch}
                        />
                      </div>

                      {/* Recent Activity - Takes 1 column */}
                      <div className="lg:col-span-1">
                        <RealtimeActivityIndicator
                          {...getRealtimeActivity()}
                          onRefresh={async () => {
                            await refetch();
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  // Empty state if no activity data
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500">No activity data available</p>
                  </div>
                )}
              </div>

              {/* Users List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  {/* Header Row */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      All Users
                      {filteredAndSortedUsers.length !==
                        (data?.users?.length || 0) && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({filteredAndSortedUsers.length} of{" "}
                          {data.users.length})
                        </span>
                      )}
                      {totalPages > 1 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          • Page {currentPage} of {totalPages}
                        </span>
                      )}
                    </h2>

                    {/* Filter Controls Row */}
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      <div className="flex flex-wrap gap-3 items-center">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-gray-500" />
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="created_desc">Newest First</option>
                            <option value="created_asc">Oldest First</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                            <option value="company_name_asc">
                              Company Name (A-Z)
                            </option>
                            <option value="company_name_desc">
                              Company Name (Z-A)
                            </option>
                            <option value="role_asc">Role</option>
                          </select>
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Roles</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="company_admin">Company Admin</option>
                          </select>
                        </div>

                        {/* Account Filters */}
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <select
                            value={demoModeFilter}
                            onChange={(e) => setDemoModeFilter(e.target.value)}
                            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Accounts</option>
                            <option value="demo_only">Demo Only</option>
                            <option value="non_demo">Non-Demo Only</option>
                          </select>
                        </div>
                      </div>

                      {/* Search bar on the right */}
                      <input
                        type="text"
                        placeholder="Search users, emails, companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                      />
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters() && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {search && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          Search: {search}
                          <button onClick={() => setSearch("")}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {roleFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          Role: {roleFilter.replace("_", " ")}
                          <button onClick={() => setRoleFilter("all")}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {demoModeFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {demoModeFilter === "demo_only"
                            ? "Demo Only"
                            : "Non-Demo Only"}
                          <button onClick={() => setDemoModeFilter("all")}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {/* Clear All Filters Button */}
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 font-medium transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="divide-y">
                  {filteredAndSortedUsers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    paginatedUsers.map((user: User) => (
                      <div key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {user.name || "(No Name)"}
                              </h3>
                              <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                                {user.email_verified && (
                                  <UserCheck className="h-3.5 w-3.5 text-green-600">
                                    <title>Email Verified</title>               
                                  </UserCheck>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.id);
                                    toast.success("User ID copied!");
                                  }}
                                  className="font-mono bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors flex items-center gap-1 group"
                                  title="Click to copy ID"
                                >
                                  ID: {user.id}
                                  <svg
                                    className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                {user.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {user.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(user.created_at)}
                                </span>
                                <span>•</span>
                                <span className="font-medium capitalize">
                                  {user.role.replace("_", " ")}
                                </span>
                                <span>•</span>
                                <span>{user.company_count} companies</span>
                                <span>•</span>
                                <span>
                                  Primary: {user.company_name || "N/A"}
                                </span>
                              </div>
                              {/* This is the new logic you requested */}
                              <div className="mt-2 flex items-center gap-2">
                                {user.company_is_demo && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Demo Company
                                  </span>
                                )}

                                {(!user.name ||
                                  !user.phone ||
                                  user.company_count === 0) && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Incomplete
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() =>
                              viewCompanyDashboard(user.company_id!)
                            }
                            variant="outline"
                            className="flex items-center space-x-2"
                            disabled={!user.company_id} // Disable if user has no company
                            title={
                              user.company_id
                                ? "View Primary Company Dashboard"
                                : "User has no company"
                            }
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Company</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {filteredAndSortedUsers.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>Showing </span>
                      <span className="font-medium mx-1">{startItem}</span>
                      <span> to </span>
                      <span className="font-medium mx-1">{endItem}</span>
                      <span> of </span>
                      <span className="font-medium mx-1">
                        {totalFilteredUsers}
                      </span>
                      <span> results</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* First Page */}
                      <Button
                        variant="outline"
                        onClick={() => goToPage(1)}
                        disabled={!hasPrev}
                        title="First page"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>

                      {/* Previous Page */}
                      <Button
                        variant="outline"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={!hasPrev}
                        title="Previous page"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page Info */}
                      <div className="px-3 text-sm">
                        Page <span className="font-medium">{currentPage}</span>{" "}
                        of <span className="font-medium">{totalPages}</span>
                      </div>

                      {/* Next Page */}
                      <Button
                        variant="outline"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={!hasNext}
                        title="Next page"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {/* Last Page */}
                      <Button
                        variant="outline"
                        onClick={() => goToPage(totalPages)}
                        disabled={!hasNext}
                        title="Last page"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                      </Button>

                      {/* Page Size Selector */}
                      <div className="ml-3">
                        <CustomDropdown
                          options={[
                            { value: "10", label: "10 per page" },
                            { value: "25", label: "25 per page" },
                            { value: "50", label: "50 per page" },
                            { value: "100", label: "100 per page" },
                          ]}
                          value={pageSize.toString()}
                          onChange={(value) => setPageSize(Number(value))}
                          className="w-36"
                          forceUpward={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Support Access Modal */}
        <TokenSupportAccessModal
          isOpen={showTokenModal}
          onClose={() => setShowTokenModal(false)}
        />

        {/* Create Company Modal */}
        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onClose={() => setShowCreateCompanyModal(false)}
          onSuccess={async () => await invalidateDashboard()}
        />

        {/* Contact Queries Modal */}
        <ContactQueriesModal
          isOpen={showContactQueriesModal}
          onClose={() => setShowContactQueriesModal(false)}
        />
      </Layout>
    </ProtectedRoute>
  );
}
