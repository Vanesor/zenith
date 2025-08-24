"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserMinus,
  Settings,
  Calendar,
  MessageSquare,
  FileText,
  Shield,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProfileModal from "@/components/ProfileModal";
import SafeAvatar from "@/components/SafeAvatar";

interface Club {
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  status: "active" | "inactive" | "pending";
  member_count: number;
  coordinator_id: string;
  coordinator_name: string;
  created_at: string;
  updated_at: string;
}

interface ClubMember {
  id: string;
  name: string;
  email: string;
  role: string;
  club_id: string;
  club_name: string;
  joined_at: string;
  avatar?: string;
}

interface AdminStats {
  totalClubs: number;
  activeClubs: number;
  pendingClubs: number;
  totalMembers: number;
  totalEvents: number;
  totalAssignments: number;
}

export default function AdminClubManagementPage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalClubs: 0,
    activeClubs: 0,
    pendingClubs: 0,
    totalMembers: 0,
    totalEvents: 0,
    totalAssignments: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showEditClub, setShowEditClub] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    type: string;
    id: string;
    name: string;
  }>({ show: false, type: "", id: "", name: "" });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Enhanced role checking for admin access
  const userRole = user?.role?.toLowerCase() || '';
  
  // Zenith Committee Members - can see all clubs
  const isZenithCommittee = [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ].includes(userRole);

  // Club Coordinators - should be redirected to their specific club management
  const isClubCoordinator = [
    'coordinator',
    'co_coordinator',
    'club_coordinator',
    'co-coordinator'
  ].includes(userRole);

  // System Admin - full access
  const isSystemAdmin = userRole === 'admin';

  // Only Zenith committee and system admins should access this page
  const hasMultiClubAccess = isZenithCommittee || isSystemAdmin;

  // Redirect club coordinators to their specific club management page
  useEffect(() => {
    if (!isLoading && user && !hasMultiClubAccess) {
      if (isClubCoordinator) {
        console.log('Club coordinator detected, redirecting to club-management');
        router.push('/club-management');
        return;
      } else {
        console.log('User does not have admin access, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, hasMultiClubAccess, isClubCoordinator, router]);

  useEffect(() => {
    if (hasMultiClubAccess && isAuthenticated) {
      console.log('🔍 Admin Club Management - useEffect triggered for Zenith committee/admin');
      console.log('📊 Current state:', { 
        isLoading, 
        user: user?.name, 
        userRole: user?.role, 
        hasMultiClubAccess,
        isZenithCommittee,
        isSystemAdmin
      });
      
      // Fetch data immediately when component mounts
      fetchAdminData();
    }
  }, [hasMultiClubAccess, isAuthenticated]); // Only fetch when user has proper access

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch admin data...');
      
      // Fetch admin clubs data with authentication
      const adminResponse = await fetch('/api/admin/clubs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Admin Clubs API response status:', adminResponse.status);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('📋 Admin data received:', adminData);
        
        if (adminData.success) {
          const { clubs: clubsList, members: membersList, stats: systemStats } = adminData;
          
          console.log('🏛️ Processing', clubsList.length, 'clubs for admin view');
          
          // Set clubs data directly since it's already formatted for admin view
          setClubs(clubsList);
          
          // Set members data
          setMembers(membersList || []);
          
          // Set system stats
          setStats(systemStats);
          
          console.log('✅ Admin data processed:', {
            clubs: clubsList.length,
            members: membersList?.length || 0,
            stats: systemStats
          });
        } else {
          throw new Error('Invalid response format');
        }
      } else if (adminResponse.status === 403) {
        // User doesn't have admin access, redirect them
        console.log('❌ Access denied to admin endpoint');
        showToast({
          type: "error",
          title: "Access Denied",
          message: "You don't have permission to access admin features"
        });
        router.push('/dashboard');
        return;
      } else {
        throw new Error(`Failed to fetch admin data: ${adminResponse.status}`);
      }
      
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load admin data"
      });
    } finally {
      setLoading(false);
      console.log('🏁 Finished fetching admin data');
    }
  };

  const handleClubStatusChange = async (clubId: string, newStatus: string) => {
    try {
      // For now, we'll just update the local state since we don't have a status update API
      // This would need to be implemented in the backend
      showToast({
        type: "info",
        title: "Feature Coming Soon",
        message: "Club status updates will be available in a future update"
      });
      
      // Update local state optimistically
      setClubs(prev => prev.map(club => 
        club.id === clubId ? { ...club, status: newStatus as any } : club
      ));
    } catch (error) {
      console.error("Error updating club status:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to update club status"
      });
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Club deleted successfully"
        });
        fetchAdminData();
        setShowDeleteModal({ show: false, type: "", id: "", name: "" });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete club");
      }
    } catch (error) {
      console.error("Error deleting club:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to delete club"
      });
    }
  };

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.coordinator_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || club.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100";
      case "inactive": return "text-red-600 bg-red-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4" />;
      case "inactive": return <XCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Authentication check moved to the top of component with useEffect
  if (!isAuthenticated) {
    return null; // The auth modal will be shown by useAuthGuard
  }

  // Runtime check for export
  if (typeof AdminClubManagementPage !== 'function') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Component Error</h2>
        <p className="text-gray-600 mb-4">The default export is not a valid React component.</p>
      </div>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-college-primary"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!hasMultiClubAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Club Management Admin</h1>
              <p className="text-gray-600 mt-2">Manage all clubs, members, and activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateClub(true)}
                className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Club</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Clubs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClubs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Clubs</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeClubs}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalMembers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: "overview", label: "Club Overview", icon: Users },
                { id: "members", label: "All Members", icon: UserPlus },
                { id: "content", label: "Content Management", icon: FileText },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-college-primary text-college-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search clubs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-college-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-college-primary focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Clubs Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Club
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinator
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClubs.map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold`} style={{ backgroundColor: club.color }}>
                                {club.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{club.name}</div>
                                <div className="text-sm text-gray-500">{club.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{club.coordinator_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{club.member_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(club.status)}`}>
                              {getStatusIcon(club.status)}
                              <span className="capitalize">{club.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(club.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/admin/clubs/${club.id}`)}
                                className="text-college-primary hover:text-college-primary/80"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedClub(club);
                                  setShowEditClub(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteModal({
                                  show: true,
                                  type: "club",
                                  id: club.id,
                                  name: club.name
                                })}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <select
                                value={club.status}
                                onChange={(e) => handleClubStatusChange(club.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredClubs.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">All Club Members</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Club
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                          <tr key={`${member.id}-${member.club_id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <SafeAvatar
                                  src={member.avatar}
                                  fallbackName={member.name}
                                  size="sm"
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{member.club_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setShowProfileModal(true);
                                }}
                                className="text-college-primary hover:text-college-primary/80"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "content" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Content Management</h3>
                
                {/* Content Management Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Landing Page Management */}
                  {(isZenithCommittee || isSystemAdmin) && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-full mr-4">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Landing Page</h4>
                          <p className="text-sm text-gray-600">Manage homepage content</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => router.push('/admin/content/landing/carousel')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Manage Carousel
                        </button>
                        <button
                          onClick={() => router.push('/admin/content/landing/team')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Manage Team Cards
                        </button>
                        <button
                          onClick={() => router.push('/admin/content/landing/events')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Featured Events
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Club Pages Management */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 p-3 rounded-full mr-4">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Club Pages</h4>
                        <p className="text-sm text-gray-600">Manage club-specific content</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {isZenithCommittee || isSystemAdmin ? (
                        <>
                          <button
                            onClick={() => router.push('/admin/content/clubs')}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Manage All Clubs
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            You can manage content for all club pages
                          </p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/admin/content/club/${user?.club_id || 'my-club'}`)}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Manage My Club
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            You can only manage your club's content
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Content Stats */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 p-3 rounded-full mr-4">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Content Stats</h4>
                        <p className="text-sm text-gray-600">Overview of content</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Carousel Slides:</span>
                        <span className="font-medium">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Team Members:</span>
                        <span className="font-medium">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Featured Events:</span>
                        <span className="font-medium">--</span>
                      </div>
                      <button className="w-full mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Content Updates */}
                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Content Updates</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Landing page carousel updated</span>
                      </div>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">New team member added</span>
                      </div>
                      <span className="text-xs text-gray-400">1 day ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Featured event modified</span>
                      </div>
                      <span className="text-xs text-gray-400">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Settings</h3>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
                    <p className="text-gray-600 mb-4">Download club and member data for reporting.</p>
                    <div className="space-x-2">
                      <button className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export Clubs</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Bulk Operations</h4>
                    <p className="text-gray-600 mb-4">Perform bulk operations on clubs and members.</p>
                    <div className="space-x-2">
                      <button className="bg-blue-600 text-primary px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Import Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal.show}
        onClose={() => setShowDeleteModal({ show: false, type: "", id: "", name: "" })}
        onConfirm={() => {
          if (showDeleteModal.type === "club") {
            handleDeleteClub(showDeleteModal.id);
          }
        }}
        title={`Delete ${showDeleteModal.type}`}
        message={`Are you sure you want to delete "${showDeleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Profile Modal */}
      {showProfileModal && selectedMemberId && (
        <ProfileModal
          userId={selectedMemberId}
          open={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedMemberId(null);
          }}
        />
      )}
    </div>
  );
}