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
  Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProfileModal from "@/components/ProfileModal";
import TokenManager from "@/lib/TokenManager";

interface ClubMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  avatar?: string;
}

interface ClubEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  attendees_count: number;
  status: "upcoming" | "ongoing" | "completed";
}

interface ClubAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  startDate?: string; // Optional start date
  start_date?: string; // Database field name
  submissions_count: number;
  max_points: number;
  status: "pending" | "upcoming" | "overdue" | "submitted" | "active" | "draft" | "closed";
}

interface ClubStats {
  totalMembers: number;
  activeEvents: number;
  pendingAssignments: number;
  monthlyPosts: number;
}

export default function ClubManagementPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [clubData, setClubData] = useState<{
    club: {
      id: string;
      name: string;
      description: string;
      type: string;
      color: string;
    };
    members: ClubMember[];
    events: ClubEvent[];
    assignments: ClubAssignment[];
    stats: ClubStats;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    type: string;
    id: string;
    name: string;
  }>({ show: false, type: "", id: "", name: "" });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAssignmentActionModal, setShowAssignmentActionModal] = useState<{
    show: boolean;
    type: 'edit' | 'delete' | 'error';
    id: string;
    title: string;
    message: string;
    canProceed: boolean;
  }>({ 
    show: false,
    type: 'delete',
    id: '',
    title: '',
    message: '',
    canProceed: true
  });
  
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
  });

  const handleEditAssignment = (assignment: ClubAssignment) => {
    // Check if the assignment is past its start date
    if (new Date() > new Date(assignment.startDate || '2000-01-01')) {
      setShowAssignmentActionModal({
        show: true,
        type: 'error',
        id: assignment.id,
        title: 'Cannot Edit Assignment',
        message: 'This assignment cannot be edited because it has already started or has submissions.',
        canProceed: false
      });
    } else {
      // Show confirmation modal
      setShowAssignmentActionModal({
        show: true,
        type: 'edit',
        id: assignment.id,
        title: 'Edit Assignment',
        message: 'Are you sure you want to edit this assignment? Any changes will be applied immediately.',
        canProceed: true
      });
    }
  };

  const handleConfirmEditAssignment = (assignmentId: string) => {
    // Close modal
    setShowAssignmentActionModal({
      show: false,
      type: 'edit',
      id: '',
      title: '',
      message: '',
      canProceed: true
    });
    
    // Navigate to edit page
    router.push(`/assignments/${assignmentId}/edit`);
  };
  
  const handleDeleteAssignmentModal = (assignment: ClubAssignment) => {
    // Check if the assignment is past its start date
    if (new Date() > new Date(assignment.startDate || '2000-01-01')) {
      setShowAssignmentActionModal({
        show: true,
        type: 'error',
        id: assignment.id,
        title: 'Cannot Delete Assignment',
        message: 'This assignment cannot be deleted because it has already started or has submissions.',
        canProceed: false
      });
    } else {
      // Show confirmation modal
      setShowAssignmentActionModal({
        show: true,
        type: 'delete',
        id: assignment.id,
        title: 'Delete Assignment',
        message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
        canProceed: true
      });
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    // Set up confirmation modal for deleting an assignment
    setShowDeleteModal({
      show: true,
      type: "assignment",
      id: assignmentId,
      name: "this assignment"
    });
  };

  const handleConfirmDeleteAssignment = async (assignmentId: string) => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(
        `/api/assignments/${assignmentId}`, 
        { method: "DELETE" }
      );

      if (response.ok) {
        // Filter out the deleted assignment from the UI
        setClubData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            assignments: prev.assignments.filter(a => a.id !== assignmentId)
          };
        });
        
        showToast({
          type: "success", 
          title: "Success", 
          message: "Assignment deleted successfully"
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Error",
          message: errorData.error || "Failed to delete assignment"
        });
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred"
      });
    } finally {
      // Close the modal
      setShowDeleteModal({ show: false, type: "", id: "", name: "" });
    }
  };

  const isManager =
    user &&
    [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

  useEffect(() => {
    if (!isLoading && (!user || !isManager)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, isManager, router]);

  useEffect(() => {
    const fetchClubData = async () => {
      if (!user || !user.club_id) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch(`/api/clubs/${user.club_id}/management`);

        if (response.ok) {
          const data = await response.json();
          setClubData(data);
        } else {
          showToast({
            type: "error",
            title: "Load Failed",
            message: "Failed to load club management data",
          });
        }
      } catch (error) {
        console.error("Error fetching club data:", error);
        showToast({
          type: "error",
          title: "Load Failed",
          message: "Failed to load club data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [user, showToast]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !user?.club_id) return;

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/clubs/${user.club_id}/members`, {
        method: "POST",
        body: JSON.stringify({ email: newMemberEmail.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setClubData((prev) =>
          prev
            ? {
                ...prev,
                members: [...prev.members, data.member],
                stats: {
                  ...prev.stats,
                  totalMembers: prev.stats.totalMembers + 1,
                },
              }
            : null
        );
        setNewMemberEmail("");
        setShowAddMember(false);
        showToast({
          type: "success",
          title: "Member Added",
          message: "Successfully added new member to the club",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Add Failed",
          message: errorData.error || "Failed to add member",
        });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      showToast({
        type: "error",
        title: "Add Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.club_id) return;

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(
        `/api/clubs/${user.club_id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setClubData((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.id !== memberId),
                stats: {
                  ...prev.stats,
                  totalMembers: prev.stats.totalMembers - 1,
                },
              }
            : null
        );
        setShowDeleteModal({ show: false, type: "", id: "", name: "" });
        showToast({
          type: "success",
          title: "Member Removed",
          message: "Successfully removed member from the club",
        });
      } else {
        showToast({
          type: "error",
          title: "Remove Failed",
          message: "Failed to remove member",
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      showToast({
        type: "error",
        title: "Remove Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  // Show member profile modal
  const handleViewMemberProfile = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowProfileModal(true);
  };
  
  // Close member profile modal
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedMemberId(null);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !user?.club_id) return;

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          ...newEvent,
          club_id: user.club_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClubData((prev) =>
          prev
            ? {
                ...prev,
                events: [...prev.events, data.event],
                stats: {
                  ...prev.stats,
                  activeEvents: prev.stats.activeEvents + 1,
                },
              }
            : null
        );
        setNewEvent({
          title: "",
          description: "",
          event_date: "",
          event_time: "",
          location: "",
        });
        setShowCreateEvent(false);
        showToast({
          type: "success",
          title: "Event Created",
          message: "Successfully created new event",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Create Failed",
          message: errorData.error || "Failed to create event",
        });
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showToast({
        type: "error",
        title: "Create Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isManager) {
    return null;
  }

  if (!clubData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Club Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load club management data
          </p>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      coordinator: "bg-purple-100 text-purple-800 border-purple-200",
      co_coordinator: "bg-blue-100 text-blue-800 border-blue-200",
      secretary: "bg-green-100 text-green-800 border-green-200",
      media: "bg-pink-100 text-pink-800 border-pink-200",
      president: "bg-red-100 text-red-800 border-red-200",
      vice_president: "bg-orange-100 text-orange-800 border-orange-200",
      member: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Club Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage {clubData.club?.name} members, events, and activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clubData.stats.totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Events
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clubData.stats.activeEvents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assignments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clubData.stats.pendingAssignments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Posts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clubData.stats.monthlyPosts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", name: "Overview", icon: Settings },
                { id: "members", name: "Members", icon: Users },
                { id: "events", name: "Events", icon: Calendar },
                { id: "assignments", name: "Assignments", icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "members" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Club Members
                  </h3>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {clubData.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewMemberProfile(member.id)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-md bg-blue-100 dark:bg-blue-800 dark:text-blue-200 flex items-center"
                          title="View member profile"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="text-xs">View Profile</span>
                        </button>
                        
                        {member.role === "member" && (
                          <button
                            onClick={() =>
                              setShowDeleteModal({
                                show: true,
                                type: "member",
                                id: member.id,
                                name: member.name,
                              })
                            }
                            className="text-red-600 hover:text-red-700 p-2"
                            title="Remove member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Club Assignments
                  </h3>
                  <button
                    onClick={() => router.push("/assignments/create")}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assignment</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {clubData.assignments.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">
                        No assignments found. Create your first assignment!
                      </p>
                    </div>
                  ) : (
                    clubData.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              {assignment.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {assignment.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                              {assignment.startDate && (
                                <span>Starts: {new Date(assignment.startDate).toLocaleDateString()}</span>
                              )}
                              <span>{assignment.submissions_count || 0} submissions</span>
                              <span>Max Points: {assignment.max_points}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                assignment.status === "pending"
                                  ? "bg-blue-100 text-blue-800"
                                  : assignment.status === "upcoming"
                                  ? "bg-green-100 text-green-800" 
                                  : assignment.status === "overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {assignment.status.toUpperCase()}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditAssignment(assignment)}
                                className={`p-1 ${new Date() > new Date(assignment.startDate || '2000-01-01') 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-blue-600 hover:text-blue-800 transition-colors'}`}
                                title="Edit Assignment"
                                disabled={new Date() > new Date(assignment.startDate || '2000-01-01')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => router.push(`/assignments/${assignment.id}/results`)}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="View Results"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteAssignmentModal(assignment)}
                                className={`p-1 ${new Date() > new Date(assignment.startDate || '2000-01-01') 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-800 transition-colors'}`}
                                title="Delete Assignment"
                                disabled={new Date() > new Date(assignment.startDate || '2000-01-01')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Club Events
                  </h3>
                  <button
                    onClick={() => setShowCreateEvent(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {clubData.events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              {event.event_date} at {event.event_time}
                            </span>
                            <span>{event.location}</span>
                            <span>{event.attendees_count} attendees</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : event.status === "ongoing"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Member
              </h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter member's email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Event
              </h3>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Event description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, event_date: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="time"
                  value={newEvent.event_time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, event_time: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateEvent}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Event
                </button>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal.show}
        onClose={() =>
          setShowDeleteModal({ show: false, type: "", id: "", name: "" })
        }
        onConfirm={() => {
          if (showDeleteModal.type === "assignment") {
            handleConfirmDeleteAssignment(showDeleteModal.id);
          } else {
            handleRemoveMember(showDeleteModal.id);
          }
        }}
        title={showDeleteModal.type === "assignment" ? "Delete Assignment" : `Remove ${showDeleteModal.name}`}
        message={showDeleteModal.type === "assignment" 
          ? "Are you sure you want to delete this assignment? This action cannot be undone."
          : `Are you sure you want to remove ${showDeleteModal.name} from the club? This action cannot be undone.`
        }
        confirmText={showDeleteModal.type === "assignment" ? "Delete" : "Remove"}
        type="danger"
      />

      {/* Member Details Modal */}
      {/* ProfileModal for viewing member details */}
      <ProfileModal 
        userId={selectedMemberId} 
        open={showProfileModal} 
        onClose={handleCloseProfileModal} 
      />

      {/* Assignment Action Modal */}
      {showAssignmentActionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${showAssignmentActionModal.type === 'error' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {showAssignmentActionModal.title}
              </h3>
              <button
                onClick={() => setShowAssignmentActionModal({ 
                  show: false, 
                  type: 'edit', 
                  id: '', 
                  title: '', 
                  message: '',
                  canProceed: true 
                })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {showAssignmentActionModal.message}
            </p>
            <div className="flex space-x-3">
              {showAssignmentActionModal.canProceed && (
                <button
                  onClick={() => {
                    if (showAssignmentActionModal.type === 'edit') {
                      handleConfirmEditAssignment(showAssignmentActionModal.id);
                    } else if (showAssignmentActionModal.type === 'delete') {
                      handleDeleteAssignment(showAssignmentActionModal.id);
                    }
                  }}
                  className={`flex-1 px-4 py-2 ${
                    showAssignmentActionModal.type === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors`}
                >
                  {showAssignmentActionModal.type === 'edit' ? 'Edit' : 'Delete'}
                </button>
              )}
              <button
                onClick={() => setShowAssignmentActionModal({ 
                  show: false, 
                  type: 'edit', 
                  id: '', 
                  title: '', 
                  message: '',
                  canProceed: true 
                })}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-300"
              >
                {showAssignmentActionModal.canProceed ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
