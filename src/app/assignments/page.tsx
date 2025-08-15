"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Search,
  Upload,
  Eye,
  Loader2,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TokenManager from "@/lib/TokenManager";

interface Assignment {
  id: string;
  title: string;
  description: string;
  club: string | { id: string; name: string } | null;
  assignedBy: string | { id: string; name: string } | null;
  dueDate: string;
  submittedAt?: string;
  status: "pending" | "submitted" | "graded" | "overdue";
  grade?: string;
  maxPoints: number;
  instructions: string;
  feedback?: string;
  created_at: string;
  creator?: { id: string; name: string } | null;
  submissions?: Array<{
    id: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
    status: string;
  }>;
}

export default function AssignmentsPage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to view your assignments and tasks",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingAssignment, setStartingAssignment] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "graded" | "overdue"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user || !isAuthenticated) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/assignments");

        if (response.ok) {
          const data = await response.json();
          
          // Transform the data to match our interface
          const transformedAssignments = data.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            club: assignment.club || assignment.club_id,
            assignedBy: assignment.creator || assignment.created_by,
            creator: assignment.creator,
            dueDate: assignment.due_date || assignment.dueDate,
            status: assignment.submissions && assignment.submissions.length > 0 
              ? (assignment.submissions[0].grade !== null ? "graded" : "submitted") 
              : "pending",
            grade: assignment.submissions && assignment.submissions.length > 0 
              ? assignment.submissions[0].grade?.toString() 
              : undefined,
            maxPoints: assignment.max_points || assignment.maxPoints || 100,
            instructions: assignment.instructions || "",
            feedback: assignment.submissions && assignment.submissions.length > 0 
              ? assignment.submissions[0].feedback 
              : undefined,
            created_at: assignment.created_at,
            submissions: assignment.submissions,
            submittedAt: assignment.submissions && assignment.submissions.length > 0 
              ? assignment.submissions[0].submitted_at 
              : undefined
          }));
          
          setAssignments(transformedAssignments);
        } else {
          console.error("Failed to fetch assignments");
          setAssignments([]);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user, isAuthenticated]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "submitted":
        return <CheckCircle className="w-5 h-5 text-zenith-primary" />;
      case "graded":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-zenith-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "graded":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-zenith-section text-zenith-secondary";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleStartAssignment = async (assignmentId: string) => {
    try {
      setStartingAssignment(assignmentId);
      
      // Simulate API call to start assignment (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to assignment taking page
      router.push(`/assignments/${assignmentId}/take`);
    } catch (error) {
      console.error('Error starting assignment:', error);
      // Handle error - could show toast notification
      alert('Failed to start assignment. Please try again.');
    } finally {
      setStartingAssignment(null);
    }
  };

  const handleViewResults = async (assignmentId: string) => {
    try {
      setStartingAssignment(assignmentId);
      
      // Simulate API call to get results (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to results page
      router.push(`/assignments/${assignmentId}/results`);
    } catch (error) {
      console.error('Error viewing results:', error);
      alert('Failed to load results. Please try again.');
    } finally {
      setStartingAssignment(null);
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 0) {
      return "Overdue";
    } else if (diffInHours < 24) {
      return `Due in ${Math.floor(diffInHours)} hours`;
    } else if (diffInHours < 48) {
      return "Due tomorrow";
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "overdue" && assignment.status === "overdue") ||
      (filter !== "overdue" && assignment.status === filter);
    
    const clubName = typeof assignment.club === 'object' && assignment.club?.name 
      ? assignment.club.name 
      : (typeof assignment.club === 'string' ? assignment.club : '');
    
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clubName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const overdueCount = assignments.filter(
    (a) => a.status === "pending" && isOverdue(a.dueDate)
  ).length;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // The auth modal will be shown by useAuthGuard
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-main transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-zenith-muted">
              Loading assignments...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zenith-primary mb-2">
              Assignments
            </h1>
            <p className="text-zenith-muted">
              Track your club assignments and submissions
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  {pendingCount} pending
                </span>
              )}
              {overdueCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Total
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {assignments.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-zenith-primary" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Pending
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {pendingCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Submitted
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {assignments.filter((a) => a.status === "submitted").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-zenith-primary" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Graded
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {assignments.filter((a) => a.status === "graded").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-zenith-card rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-zenith-muted" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary bg-zenith-card text-zenith-primary"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "submitted", label: "Submitted" },
                { key: "graded", label: "Graded" },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as typeof filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.key
                      ? "bg-zenith-primary text-white"
                      : "bg-zenith-hover text-zenith-secondary hover:bg-zenith-border"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
              
              {/* Add Create Assignment button for users with permissions */}
              {user && ['admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 
                'vice_president', 'instructor', 'teacher', 'staff', 'management'].includes(user.role) && (
                <button
                  onClick={() => router.push('/assignments/create')}
                  className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors ml-2"
                >
                  Create Assignment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-zenith-card rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                Loading assignments...
              </h3>
              <p className="text-zenith-muted">
                Please wait while we fetch your assignments.
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-zenith-card rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-zenith-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                No assignments found
              </h3>
              <p className="text-zenith-muted">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "No assignments match your current filter."}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`bg-zenith-card rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  assignment.status === "pending" &&
                  isOverdue(assignment.dueDate)
                    ? "border-l-4 border-red-500"
                    : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-zenith-primary">
                            {assignment.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              assignment.status
                            )}`}
                          >
                            {assignment.status.charAt(0).toUpperCase() +
                              assignment.status.slice(1)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {typeof assignment.club === 'object' && assignment.club?.name 
                              ? assignment.club.name 
                              : (typeof assignment.club === 'string' ? assignment.club : 'No Club')}
                          </span>
                        </div>
                        <p className="text-zenith-muted mb-4">
                          {assignment.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zenith-muted">
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            Assigned by {typeof assignment.creator === 'object' && assignment.creator?.name 
                              ? assignment.creator.name 
                              : (typeof assignment.assignedBy === 'object' && assignment.assignedBy?.name 
                                ? assignment.assignedBy.name 
                                : (typeof assignment.assignedBy === 'string' ? assignment.assignedBy : 'Unknown'))}
                          </div>
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {formatDueDate(assignment.dueDate)}
                          </div>
                          <div className="flex items-center">
                            <FileText size={16} className="mr-2" />
                            {assignment.maxPoints} points
                          </div>
                        </div>
                      </div>
                    </div>
                    {assignment.grade && (
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600">
                          {assignment.grade}
                        </div>
                        <div className="text-sm text-zenith-muted">
                          /{assignment.maxPoints}
                        </div>
                      </div>
                    )}
                  </div>

                  {assignment.instructions && (
                    <div className="mb-4 p-4 bg-zenith-hover rounded-lg">
                      <h4 className="font-medium text-zenith-primary mb-2">
                        Instructions:
                      </h4>
                      <p className="text-zenith-muted text-sm">
                        {assignment.instructions}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zenith-border">
                    <div className="flex items-center space-x-4">
                      {assignment.submittedAt && (
                        <span className="text-sm text-zenith-muted">
                          Submitted{" "}
                          {new Date(
                            assignment.submittedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.status === "pending" &&
                        isOverdue(assignment.dueDate) && (
                          <span className="flex items-center text-red-600 text-sm">
                            <AlertCircle size={16} className="mr-1" />
                            Overdue
                          </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {assignment.status === "pending" && (
                        <button 
                          onClick={() => handleStartAssignment(assignment.id)}
                          disabled={startingAssignment === assignment.id}
                          className="flex items-center px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {startingAssignment === assignment.id ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                          ) : (
                            <Upload size={16} className="mr-2" />
                          )}
                          {startingAssignment === assignment.id ? 'Starting...' : 'Start Assignment'}
                        </button>
                      )}
                      {(assignment.status === "submitted" || assignment.status === "graded") && (
                        <button 
                          onClick={() => handleViewResults(assignment.id)}
                          disabled={startingAssignment === assignment.id}
                          className="flex items-center px-4 py-2 text-zenith-muted hover:text-zenith-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {startingAssignment === assignment.id ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                          ) : (
                            <Eye size={16} className="mr-2" />
                          )}
                          {startingAssignment === assignment.id ? 'Loading...' : 'View Results'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
