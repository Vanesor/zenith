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
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";
import TokenManager from "@/lib/TokenManager";

interface Assignment {
  id: string;
  title: string;
  description: string;
  club: string;
  assignedBy: string;
  dueDate: string;
  submittedAt?: string;
  status: "pending" | "submitted" | "graded" | "overdue";
  grade?: string;
  maxPoints: number;
  instructions: string;
  feedback?: string;
  created_at: string;
}

export default function AssignmentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "graded" | "overdue"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/assignments");

        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
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
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "submitted":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "graded":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "graded":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.club.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const overdueCount = assignments.filter(
    (a) => a.status === "pending" && isOverdue(a.dueDate)
  ).length;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600 dark:text-gray-400">
              Loading assignments...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your club assignments and submissions
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-sm rounded-full">
                  {pendingCount} pending
                </span>
              )}
              {overdueCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submitted
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.filter((a) => a.status === "submitted").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Graded
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.filter((a) => a.status === "graded").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Loading assignments...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we fetch your assignments.
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No assignments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "No assignments match your current filter."}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
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
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {assignment.club}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {assignment.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            Assigned by {assignment.assignedBy}
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
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {assignment.grade}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          /{assignment.maxPoints}
                        </div>
                      </div>
                    )}
                  </div>

                  {assignment.instructions && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Instructions:
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {assignment.instructions}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      {assignment.submittedAt && (
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          Submitted{" "}
                          {new Date(
                            assignment.submittedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.status === "pending" &&
                        isOverdue(assignment.dueDate) && (
                          <span className="flex items-center text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle size={16} className="mr-1" />
                            Overdue
                          </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <Eye size={16} className="mr-2" />
                        View Details
                      </button>
                      {assignment.status === "pending" && (
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Upload size={16} className="mr-2" />
                          Submit
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
