"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Settings,
  Calendar,
  FileText,
  Shield,
  Edit,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Plus,
  Save,
  Mail,
  User,
  RefreshCw,
  X as XIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import SafeAvatar from "@/components/SafeAvatar";

// Interfaces for committee management
interface CommitteeMember {
  id: string;
  user_id: string;
  committee_id: string;
  name: string;
  email: string;
  role: string;
  hierarchy: number;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  academic_year?: string;
  avatar?: string;
  profile_image_url?: string;
}

interface UserEditModalProps {
  member: CommitteeMember;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, name: string, email: string, academicYear: string, role: string) => Promise<void>;
}

function UserEditModal({ member, isOpen, onClose, onUpdate }: UserEditModalProps) {
  const [name, setName] = useState(member.name || '');
  const [email, setEmail] = useState(member.email || '');
  const [academicYear, setAcademicYear] = useState(member.academic_year || '');
  const [role, setRole] = useState(member.role || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setName(member.name || '');
      setEmail(member.email || '');
      setAcademicYear(member.academic_year || '');
      setRole(member.role || '');
      setErrorMessage('');
      
      // Fetch available roles for the committee
      fetchRoles(member.committee_id);
    }
  }, [isOpen, member]);
  
  const fetchRoles = async (committeeId: string) => {
    try {
      // Get the authentication token from localStorage with error handling
      let token;
      try {
        token = localStorage.getItem('zenith-token');
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      
      const response = await fetch(`/api/committee-roles?committeeId=${committeeId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        console.error('Failed to load committee roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }
    
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }
    
    if (!academicYear.trim()) {
      setErrorMessage('Academic year is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await onUpdate(member.user_id, name, email, academicYear, role);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to update user information');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit User Information</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Full Name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Email Address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Academic Year</option>
                  {/* Generate options for the past 5 years and next 5 years */}
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <option key={`${year}-${year+1}`} value={`${year}-${year+1}`}>
                        {year}-{year+1}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The academic year during which this member served in this role
              </p>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Committee Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option key={`current-${member.id}`} value={member.role}>{member.role}</option>
                  {roles
                    .filter(roleItem => roleItem.name !== member.role)
                    .map(roleItem => (
                      <option key={`role-${roleItem.id}`} value={roleItem.name}>
                        {roleItem.name}
                      </option>
                    ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The member's role within the committee
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Committee {
  id: string;
  name: string;
  description: string;
  type: string;
  academic_years: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

interface CommitteeStats {
  total_committees: number;
  total_members: number;
  active_members: number;
  committees_by_type: Record<string, number>;
}

export default function CommitteeManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State management
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [stats, setStats] = useState<CommitteeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // User edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);

  // State to track if component is mounted (for client-side operations)
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch committee data
  useEffect(() => {
    // Only fetch data when component is mounted (client-side) and user is loaded
    if (isMounted && !authLoading) {
      if (user) {
        fetchCommitteeData();
      } else {
        router.push('/login');
      }
    }
  }, [user, authLoading, router, isMounted]);

  // Function to update user information
  const handleUpdateUser = async (userId: string, name: string, email: string, academicYear: string, role: string) => {
    try {
      // Get the authentication token from localStorage with error handling
      let token;
      try {
        token = localStorage.getItem('zenith-token');
      } catch (e) {
        console.error('Error accessing localStorage:', e);
        token = null;
      }
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch('/api/committee-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, name, email, academicYear, role })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user information');
      }
      
      // Update local state to reflect changes
      setCommitteeMembers(prevMembers => 
        prevMembers.map(member => 
          member.user_id === userId 
            ? { ...member, name, email, academic_year: academicYear, role } 
            : member
        )
      );
      
      showToast({
        title: "Success",
        message: "User information and committee details updated successfully",
        type: "success"
      });
    } catch (error) {
      console.error('Error updating user:', error);
      showToast({
        title: "Update Failed",
        message: error instanceof Error ? error.message : 'Failed to update user information',
        type: "error"
      });
      throw error;
    }
  };

  // Function to fetch committee data
  const fetchCommitteeData = async () => {
    try {
      setLoading(true);
      
      // Get the authentication token from localStorage with error handling
      let token;
      try {
        token = localStorage.getItem('zenith-token');
        console.log('Committee management: Token exists:', !!token);
      } catch (e) {
        console.error('Error accessing localStorage:', e);
        token = null;
      }
      
      const response = await fetch('/api/committee-management', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Committee data loaded successfully:', data);
        setCommittees(data.committees || []);
        setCommitteeMembers(data.members || []);
        setStats(data.stats || null);
      } else {
        console.error('Failed to load committee data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          showToast({ 
            title: "Authentication Error", 
            message: "Your session may have expired. Please log in again.", 
            type: "error" 
          });
          // Redirect to login if unauthorized
          setTimeout(() => router.push('/login'), 2000);
        } else {
          showToast({ 
            title: "Error", 
            message: "Failed to load committee data", 
            type: "error" 
          });
        }
      }
    } catch (error) {
      console.error("Error fetching committee data:", error);
      showToast({ title: "Error", message: "An error occurred while loading committee data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Filter committees based on search term
  const filteredCommittees = committees.filter(committee =>
    committee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter committee members based on selected committee and search term
  const filteredMembers = committeeMembers.filter(member => 
    (!selectedCommittee || member.committee_id === selectedCommittee) &&
    (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Committee Management</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage Zenith committees and their members
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Admin
              </button>
            </div>
          </div>
          
          {/* Navigation tabs */}
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: "overview", label: "Committee Overview", icon: Users },
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
                      ? "border-blue-500 text-blue-600"
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
      </header>

      {/* Main content area */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Committee Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Committees</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {stats?.total_committees || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <UserPlus className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Members</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {stats?.total_members || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Members</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {stats?.active_members || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Committee Types</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {stats?.committees_by_type ? Object.keys(stats.committees_by_type).length : 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Committee List */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    All Committees
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="relative flex-grow max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Search committees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex ml-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Committee
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCommittees.length > 0 ? (
                      filteredCommittees.map((committee) => (
                        <li key={committee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {committee.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {committee.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {committee.academic_years}
                                </span>
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {committee.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-4 px-6 text-center text-gray-500 dark:text-gray-400">
                        No committees found. Create one to get started.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Committee Members
                  </h3>
                  <div className="mt-2 flex p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900/50 dark:text-blue-300" role="alert">
                    <div className="inline-flex items-center mr-3">
                      <Edit className="h-5 w-5 mr-2" />
                      <span className="font-medium">User Management:</span>
                    </div>
                    <span>Click the <strong>"Edit User"</strong> button on any member to update their name and email address. Changes will be verified to ensure email uniqueness.</span>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div className="relative w-full sm:max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                        value={selectedCommittee || ""}
                        onChange={(e) => setSelectedCommittee(e.target.value || null)}
                      >
                        <option value="">All Committees</option>
                        {committees.map((committee) => (
                          <option key={committee.id} value={committee.id}>
                            {committee.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Member
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Committee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => {
                          const committeeData = committees.find(c => c.id === member.committee_id);
                          return (
                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <SafeAvatar 
                                      src={member.profile_image_url || member.avatar} 
                                      alt={member.name} 
                                      className="h-10 w-10 rounded-full"
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {member.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {committeeData?.name || 'Unknown Committee'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {committeeData?.type || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  {member.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {member.is_active ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(member.joined_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit User
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  onClick={() => {
                                    // Remove member function
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No members found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Committee Settings
                  </h3>
                  <div className="mt-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        User Management
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Edit user information like names and email addresses
                      </p>
                      <div className="mt-3">
                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                How to edit user information
                              </h3>
                              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p>
                                  To edit a user&apos;s name or email, go to the &quot;Members&quot; tab, find the user
                                  you want to edit, and click the &quot;Edit&quot; button next to their name.
                                </p>
                                <p className="mt-2">
                                  Committee members and administrators can edit user information.
                                  When updating an email address, the system will check that the new
                                  email is unique before saving changes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Academic Year Settings
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure the current academic year and committee terms
                      </p>
                      <div className="mt-3">
                        {/* Settings content would go here */}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Settings functionality to be implemented
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Role Configuration
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage committee role permissions and hierarchies
                      </p>
                      <div className="mt-3">
                        {/* Role settings content would go here */}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Role configuration functionality to be implemented
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* User Edit Modal */}
      {selectedMember && (
        <UserEditModal 
          member={selectedMember}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}