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

  // Check if user has admin access (coordinator, co_coordinator, or committee members)
  // For testing, let's be more permissive
  const hasAdminAccess = true; // Temporarily allow all users for testing
  // const hasAdminAccess = user && [
  //   "coordinator", "co_coordinator", "club_coordinator", "secretary", "media", "president",
  //   "vice_president", "innovation_head", "treasurer", "outreach"
  // ].includes(user.role);

  useEffect(() => {
    console.log('🔍 Club Management - useEffect triggered');
    console.log('📊 Current state:', { isLoading, user: user?.name, userRole: user?.role, hasAdminAccess });
    
    // Fetch data immediately when component mounts
    fetchAdminData();
  }, []); // Empty dependency array to run only on mount

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch admin data...');
      
      // Fetch clubs data
      const clubsResponse = await fetch('/api/clubs');
      console.log('📊 Clubs API response status:', clubsResponse.status);
      
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        console.log('📋 Clubs data received:', clubsData);
        const clubsList = clubsData.clubs || [];
        console.log('🏛️ Processing', clubsList.length, 'clubs');
        
        const processedClubs = clubsList.map((club: any) => ({
          id: club.id,
          name: club.name,
          description: club.description,
          type: club.type,
          color: club.color,
          status: 'active', // Default status since we don't have this field yet
          member_count: club.memberCount || 0,
          coordinator_id: club.coordinator_id,
          coordinator_name: club.coordinator_name,
          created_at: club.created_at,
          updated_at: club.created_at
        }));
        
        console.log('✅ Processed clubs:', processedClubs);
        setClubs(processedClubs);
        
        // Calculate stats from the clubs data
        const activeClubs = clubsList.filter((club: any) => club.memberCount > 0);
        const totalMembers = clubsList.reduce((sum: number, club: any) => sum + (club.memberCount || 0), 0);
        const totalEvents = clubsList.reduce((sum: number, club: any) => sum + (club.eventCount || 0), 0);
        
        const calculatedStats = {
          totalClubs: clubsList.length,
          activeClubs: activeClubs.length,
          pendingClubs: 0, // We don't have pending status yet
          totalMembers: totalMembers,
          totalEvents: totalEvents,
          totalAssignments: 0 // We'd need to fetch this from assignments API
        };
        
        console.log('📈 Calculated stats:', calculatedStats);
        setStats(calculatedStats);
      } else {
        throw new Error('Failed to fetch clubs');
      }
      
      // Fetch members data (you can expand this later)
      setMembers([]); // For now, set empty array
      
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

  // Only allow coordinators and committee members
  const allowedRoles = [
    'coordinator',
    'committee',
    'co_coordinator',
    'secretary',
    'media',
    'president',
    'vice_president',
    'innovation_head',
    'treasurer',
    'outreach'
  ];

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
      </div>
    );
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

  if (!hasAdminAccess) {
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
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Club Overview", icon: Users },
                { id: "members", label: "All Members", icon: UserPlus },
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