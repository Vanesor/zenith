"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserMinus,
  Settings,
  Calendar,
  FileText,
  Shield,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Mail,
  Crown,
  User,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProfileModal from "@/components/ProfileModal";
import SafeAvatar from "@/components/SafeAvatar";
import { Dialog, Transition } from '@headlessui/react';

// Interfaces
interface Club {
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  member_count: number;
  coordinator?: {
    id: string;
    name: string;
    email: string;
  };
  events_count?: number;
  assignments_count?: number;
  created_at: string;
  updated_at: string;
}

interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  hierarchy: number;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  year?: string;
  branch?: string;
  academic_year?: string;
  avatar?: string;
  profile_image_url?: string;
}

interface SystemStats {
  total_users: number;
  total_clubs: number;
  upcoming_events: number;
  active_assignments: number;
  total_club_memberships: number;
}

interface UserAccess {
  level: 'club' | 'zenith' | 'admin' | 'super_admin';
  managedClubs: string[];
}

interface ClubManagementData {
  success: boolean;
  clubs: Club[];
  members: ClubMember[];
  systemStats?: SystemStats;
  userAccess: UserAccess;
}

// UserEditModal for editing club member info
interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  member: ClubMember | null;
  onSave: (data: Partial<ClubMember>) => Promise<void>;
  roles: string[];
  years: string[];
}

function UserEditModal({ open, onClose, member, onSave, roles, years }: UserEditModalProps) {
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [role, setRole] = useState(member?.role || "");
  const [academicYear, setAcademicYear] = useState(member?.academic_year || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setEmail(member.email || "");
      setRole(member.role || "");
      setAcademicYear(member.academic_year || "");
    }
  }, [member]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    // Validate email uniqueness (API call can be added here)
    if (!email || !name) {
      setError("Name and email are required.");
      setSaving(false);
      return;
    }
    await onSave({ name, email, role, academic_year: academicYear });
    setSaving(false);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Edit Club Member
                </Dialog.Title>
                <div className="mt-2 space-y-4">
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <input
                    type="email"
                    className="w-full rounded border px-3 py-2"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <select
                    className="w-full rounded border px-3 py-2"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select
                    className="w-full rounded border px-3 py-2"
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                  >
                    <option value="">Select Academic Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

const ClubManagementPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State management
  const [data, setData] = useState<ClubManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);

  // Role hierarchy and labels
  const roleHierarchy: Record<string, { level: number, label: string, icon: any }> = {
    coordinator: { level: 1, label: "Coordinator", icon: Crown },
    co_coordinator: { level: 2, label: "Co-Coordinator", icon: Star },
    secretary: { level: 3, label: "Secretary", icon: Edit },
    treasurer: { level: 4, label: "Treasurer", icon: Settings },
    member: { level: 5, label: "Member", icon: User }
  };

  const accessLevelLabels: Record<string, string> = {
    club: "Club Manager",
    zenith: "Zenith Committee",
    admin: "System Admin",
    super_admin: "Super Admin"
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch club management data
  const fetchData = async (clubId?: string) => {
    try {
      setLoading(true);
      
      const url = clubId 
        ? `/api/club-management?clubId=${clubId}`
        : `/api/club-management`;

      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if we have a token
      const storedToken = localStorage.getItem('zenith-token');
      console.log('🔐 CLUB MANAGEMENT: Token from localStorage:', storedToken ? `${storedToken.substring(0, 15)}...` : 'None');
      
      if (storedToken && storedToken !== 'nextauth-session') {
        headers['Authorization'] = `Bearer ${storedToken}`;
        console.log('🔐 CLUB MANAGEMENT: Adding auth header to request');
      } else {
        console.log('⚠️ CLUB MANAGEMENT: No valid token found');
      }
      
      console.log('📡 CLUB MANAGEMENT: Fetching data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // This will include cookies for session-based auth
        headers,
      });

      console.log('📡 CLUB MANAGEMENT: Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ CLUB MANAGEMENT: Data received:', {
          success: result.success,
          accessLevel: result.userAccess?.level,
          clubsCount: result.clubs?.length,
          membersCount: result.members?.length
        });
        
        if (result.success) {
          setData(result);
          
          // Auto-select first club if user is club-level manager
          if (result.userAccess.level === 'club' && 
              result.userAccess.managedClubs.length === 1 && 
              !selectedClub) {
            setSelectedClub(result.userAccess.managedClubs[0]);
            console.log('🔍 CLUB MANAGEMENT: Auto-selecting club:', result.userAccess.managedClubs[0]);
          }
        } else {
          console.error('❌ CLUB MANAGEMENT: API returned error:', result.error);
          throw new Error(result.error || 'Failed to fetch data');
        }
      } else if (response.status === 401) {
        console.error('❌ CLUB MANAGEMENT: Authentication failed (401)');
        showToast({
          type: "error",
          title: "Authentication Required",
          message: "Please log in to access this page"
        });
        router.push('/login');
      } else if (response.status === 403) {
        console.error('❌ CLUB MANAGEMENT: Access denied (403)');
        showToast({
          type: "error",
          title: "Access Denied",
          message: "You don't have permission to access club management features"
        });
        router.push('/dashboard');
      } else {
        console.error(`❌ CLUB MANAGEMENT: Request failed with status ${response.status}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching club management data:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load club management data"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 CLUB MANAGEMENT: User state changed', {
      userPresent: !!user,
      authLoading,
      userRole: user?.role,
    });
    
    if (user && !authLoading) {
      console.log('🚀 CLUB MANAGEMENT: Starting data fetch with user:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Small delay to ensure token is properly set in localStorage
      setTimeout(() => {
        fetchData();
      }, 500);
    }
  }, [user, authLoading]);

  // Fetch members when club is selected
  useEffect(() => {
    if (selectedClub && data) {
      fetchData(selectedClub);
    }
  }, [selectedClub]);

  // Add member function
  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedClub) return;

    try {
      setAddingMember(true);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if we have a token
      const storedToken = localStorage.getItem('zenith-token');
      if (storedToken && storedToken !== 'nextauth-session') {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      
      const response = await fetch('/api/club-management', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'add_member',
          clubId: selectedClub,
          userEmail: newMemberEmail.trim(),
          role: newMemberRole,
          hierarchy: roleHierarchy[newMemberRole as keyof typeof roleHierarchy]?.level || 5
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast({
          type: "success",
          title: "Member Added",
          message: result.message
        });
        setShowAddMemberModal(false);
        setNewMemberEmail("");
        setNewMemberRole("member");
        if (selectedClub) {
          fetchData(selectedClub); // Refresh data
        }
      } else {
        throw new Error(result.error || 'Failed to add member');
      }
    } catch (error) {
      console.error("Error adding member:", error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to add member"
      });
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member function
  const handleRemoveMember = async () => {
    if (!selectedMember || !selectedClub) return;

    try {
      setRemovingMember(true);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {};

      // Add authorization header if we have a token
      const storedToken = localStorage.getItem('zenith-token');
      if (storedToken && storedToken !== 'nextauth-session') {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      
      const response = await fetch(
        `/api/club-management?memberId=${selectedMember.id}&clubId=${selectedClub}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include'
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        showToast({
          type: "success",
          title: "Member Removed",
          message: result.message
        });
        setShowRemoveMemberModal(false);
        setSelectedMember(null);
        if (selectedClub) {
          fetchData(selectedClub); // Refresh data
        }
      } else {
        throw new Error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error("Error removing member:", error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to remove member"
      });
    } finally {
      setRemovingMember(false);
    }
  };

  // Filter members based on search
  const filteredMembers = data?.members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get selected club data
  const selectedClubData = data?.clubs.find(club => club.id === selectedClub);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Club Management...</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h2>
          <p className="text-gray-500">Failed to load club management data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Access Level: <span className="font-medium text-blue-600">
                  {accessLevelLabels[data.userAccess.level]}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {data.userAccess.level !== 'club' && data.systemStats && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.systemStats.total_clubs}</div>
                  <div className="text-sm text-blue-500">Total Clubs</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Clubs List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {data.userAccess.level === 'club' ? 'Your Clubs' : 'All Clubs'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {data.clubs.length} club{data.clubs.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="divide-y">
                {data.clubs.map((club) => (
                  <div
                    key={club.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedClub === club.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedClub(club.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{club.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {club.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {club.member_count}
                          </div>
                          {club.events_count !== undefined && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {club.events_count}
                            </div>
                          )}
                          {club.assignments_count !== undefined && (
                            <div className="flex items-center text-sm text-gray-500">
                              <FileText className="h-4 w-4 mr-1" />
                              {club.assignments_count}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${club.color || 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Club Details and Members */}
          <div className="lg:col-span-2">
            {selectedClub && selectedClubData ? (
              <div className="space-y-6">
                
                {/* Club Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClubData.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedClubData.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedClubData.coordinator && (
                        <div className="text-sm text-gray-500">
                          <p className="font-medium">Coordinator</p>
                          <p>{selectedClubData.coordinator.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Club Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{selectedClubData.member_count}</div>
                      <div className="text-sm text-gray-500">Members</div>
                    </div>
                    {selectedClubData.events_count !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{selectedClubData.events_count}</div>
                        <div className="text-sm text-gray-500">Events</div>
                      </div>
                    )}
                    {selectedClubData.assignments_count !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{selectedClubData.assignments_count}</div>
                        <div className="text-sm text-gray-500">Assignments</div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{selectedClubData.type}</div>
                      <div className="text-sm text-gray-500">Type</div>
                    </div>
                  </div>
                </div>

                {/* Members Section */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Club Members</h3>
                        <p className="text-sm text-gray-500 mt-1">{filteredMembers.length} members</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search members..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Member
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="divide-y">
                    {filteredMembers.map((member) => {
                      const roleInfo = roleHierarchy[member.role as keyof typeof roleHierarchy];
                      const RoleIcon = roleInfo?.icon || User;
                      
                      return (
                        <div key={member.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <SafeAvatar
                                src={member.profile_image_url || member.avatar}
                                alt={member.name}
                                size="md"
                              />
                              <div>
                                <h4 className="font-medium text-gray-900">{member.name}</h4>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                <div className="flex items-center mt-1 space-x-4">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <RoleIcon className="h-4 w-4 mr-1" />
                                    {roleInfo?.label || member.role}
                                  </div>
                                  {member.year && (
                                    <span className="text-sm text-gray-500">
                                      {member.year} Year
                                    </span>
                                  )}
                                  {member.branch && (
                                    <span className="text-sm text-gray-500">
                                      {member.branch}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowEditMemberModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit member info"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowRemoveMemberModal(true);
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove member"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <div className="p-8 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {searchTerm ? 'No members found matching your search.' : 'No members in this club yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Club</h3>
                <p className="text-gray-500">Choose a club from the list to view and manage its members.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Member
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter user's email address"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          id="role"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                        >
                          <option value="member">Member</option>
                          <option value="secretary">Secretary</option>
                          <option value="treasurer">Treasurer</option>
                          {data?.userAccess.level !== 'club' && (
                            <>
                              <option value="co_coordinator">Co-Coordinator</option>
                              <option value="coordinator">Coordinator</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleAddMember}
                  disabled={addingMember || !newMemberEmail.trim()}
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMemberEmail("");
                    setNewMemberRole("member");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveMemberModal && selectedMember && (
        <ConfirmationModal
          isOpen={showRemoveMemberModal}
          onClose={() => {
            setShowRemoveMemberModal(false);
            setSelectedMember(null);
          }}
          onConfirm={handleRemoveMember}
          title="Remove Member"
          message={`Are you sure you want to remove ${selectedMember.name} from the club? This action cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          type="danger"
          isLoading={removingMember}
        />
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && selectedMember && (
        <UserEditModal
          open={showEditMemberModal}
          onClose={() => {
            setShowEditMemberModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onSave={async (data) => {
            if (!selectedMember) return;
            try {
              const res = await fetch("/api/club-management", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  memberId: selectedMember.id,
                  clubId: selectedMember.club_id,
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  academic_year: data.academic_year
                })
              });
              const result = await res.json();
              if (!res.ok) {
                showToast({ type: "error", title: "Error", message: result.error || "Failed to update member." });
                return;
              }
              showToast({ type: "success", title: "Member updated", message: "Member info updated successfully." });
              setShowEditMemberModal(false);
              setSelectedMember(null);
              // Refresh data after update
              if (selectedClub) {
                fetchData(selectedClub);
              }
            } catch (err) {
              showToast({ type: "error", title: "Error", message: "Failed to update member." });
            }
          }}
          roles={["member", "coordinator", "secretary", "treasurer"]}
          years={["2022-23", "2023-24", "2024-25", "2025-26"]}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedUserId && (
        <ProfileModal 
          userId={selectedUserId}
          open={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default ClubManagementPage;
