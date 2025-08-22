"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  Filter,
  BookOpen,
  TrendingUp,
  Star,
  Award,
  Target,
  CheckCircle2,
  XCircle,
  Hash,
  BarChart3,
  PieChart,
  Brain
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import { PaperpalHeader } from "@/components/PaperpalHeader";
import { UniversalLoader } from '@/components/UniversalLoader';
import ZenAssistant from '@/components/assignments/ZenAssistant';
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

interface AssignmentStats {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
  overdue: number;
  averageGrade: number;
  completionRate: number;
}

export default function AssignmentsPage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to view your assignments and tasks",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingAssignment, setStartingAssignment] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showZenAssistant, setShowZenAssistant] = useState(false);
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0,
    averageGrade: 0,
    completionRate: 0
  });

  // Calculate assignment statistics
  useEffect(() => {
    const now = new Date();
    const overdue = assignments.filter(a => 
      a.status === "pending" && new Date(a.dueDate) < now
    ).length;
    
    const gradedAssignments = assignments.filter(a => a.status === "graded");
    const averageGrade = gradedAssignments.length > 0 
      ? gradedAssignments.reduce((sum, a) => sum + (parseFloat(a.grade || "0") / a.maxPoints * 100), 0) / gradedAssignments.length
      : 0;

    const completionRate = assignments.length > 0 
      ? ((assignments.filter(a => a.status === "submitted" || a.status === "graded").length) / assignments.length) * 100
      : 0;

    setStats({
      total: assignments.length,
      pending: assignments.filter(a => a.status === "pending").length,
      submitted: assignments.filter(a => a.status === "submitted").length,
      graded: assignments.filter(a => a.status === "graded").length,
      overdue,
      averageGrade,
      completionRate
    });
  }, [assignments]);

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
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to fetch assignments'
          });
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch assignments'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user, isAuthenticated, showToast]);

  const handleStartAssignment = async (assignmentId: string) => {
    setStartingAssignment(assignmentId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      router.push(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error("Error starting assignment:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to start assignment'
      });
    } finally {
      setStartingAssignment(null);
    }
  };

  const handleViewResults = async (assignmentId: string) => {
    setStartingAssignment(assignmentId);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      router.push(`/assignments/${assignmentId}/results`);
    } catch (error) {
      console.error("Error viewing results:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to view results'
      });
    } finally {
      setStartingAssignment(null);
    }
  };

  const handleAssignmentGenerated = (assignment: any) => {
    // This function now only handles the final save after the user reviews/edits
    // The ZEN Assistant will stay open for preview/edit and only call this when user clicks "Save"
    
    // Close the ZEN Assistant modal only after user has reviewed and saved
    setShowZenAssistant(false);
    
    // Redirect to create page with the generated assignment data
    const assignmentData = encodeURIComponent(JSON.stringify(assignment));
    router.push(`/assignments/create?zenData=${assignmentData}`);
    
    showToast({
      type: 'success',
      title: 'Assignment Generated!',
      message: 'ZEN Assistant has created your assignment. Review and publish when ready.'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Tomorrow";
    if (diffInDays === -1) return "Yesterday";
    if (diffInDays > 0) return `In ${diffInDays} days`;
    return `${Math.abs(diffInDays)} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-400/20';
      case 'submitted': return 'text-blue-400 bg-blue-400/20';
      case 'graded': return 'text-emerald-400 bg-emerald-400/20';
      case 'overdue': return 'text-rose-400 bg-rose-400/20';
      default: return 'text-indigo-300 bg-indigo-300/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'submitted': return Upload;
      case 'graded': return CheckCircle;
      case 'overdue': return AlertCircle;
      default: return FileText;
    }
  };

  // Filter assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      if (filter === "all") return true;
      if (filter === "overdue") {
        return assignment.status === "pending" && isOverdue(assignment.dueDate);
      }
      return assignment.status === filter;
    })
    .filter(assignment =>
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof assignment.club === "object" && assignment.club?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof assignment.assignedBy === "object" && assignment.assignedBy?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <UniversalLoader message="Loading your assignments..." />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Assignments",
      value: stats.total,
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      change: "+12%"
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
      change: "-5%"
    },
    {
      title: "Completed",
      value: stats.submitted + stats.graded,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
      change: "+8%"
    },
    {
      title: "Average Grade",
      value: `${Math.round(stats.averageGrade)}%`,
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      change: "+3%"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* <PaperpalHeader 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      /> */}
      
      <div className="pt-4 px-4 pb-8">
        {/* Page Header with Royal Blue Theme */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                Assignments
              </h1>
              <p className="text-zenith-muted">
                Track your assignments, submissions, and academic progress
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/assignments/create')}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowZenAssistant(true)}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-500/20"
              >
                <Brain className="w-4 h-4 mr-2" />
                ZEN Assistant
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </motion.button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              // Updated color schemes for royal blue/purple theme
              const getCardGradient = () => {
                switch (stat.title) {
                  case "Total Assignments": return "from-indigo-600 to-blue-600";
                  case "Pending": return "from-amber-500 to-orange-600";
                  case "Completed": return "from-emerald-500 to-green-600";
                  case "Average Grade": return "from-violet-600 to-purple-600";
                  default: return "from-indigo-600 to-purple-600";
                }
              };
              
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    y: -5, 
                    transition: { duration: 0.2 } 
                  }}
                  className="group"
                >
                  <div className="bg-zenith-darker shadow-xl transition-all duration-300 border border-indigo-900/30 hover:border-indigo-500/50 rounded-xl p-5 h-full overflow-hidden relative">
                    {/* Glowing background effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getCardGradient()} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-r ${getCardGradient()} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className={`p-3 bg-gradient-to-br ${getCardGradient()} rounded-xl shadow-xl group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300`}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <motion.div 
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: 1 }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatType: "reverse", 
                            duration: 2,
                            delay: index * 0.3
                          }}
                          className="px-2 py-1 bg-indigo-500/10 rounded-md"
                        >
                          <span className="text-xs text-indigo-300 font-medium flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {stat.change}
                          </span>
                        </motion.div>
                      </div>
                      
                      <div>
                        <motion.p 
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          className="text-3xl font-bold text-white mb-2"
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-sm text-indigo-300 group-hover:text-indigo-400 transition-colors">
                          {stat.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
              <input
                type="text"
                placeholder="Search assignments, clubs, or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3.5 pl-12 pr-4 bg-zenith-darker border border-indigo-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent hover:border-indigo-500/30 text-white transition-all duration-300 shadow-md hover:shadow-lg"
              />
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center hover:bg-indigo-500/30"
                  onClick={() => setSearchTerm('')}
                >
                  <XCircle className="w-4 h-4 text-indigo-300" />
                </motion.button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "submitted", "graded", "overdue"].map((filterOption) => {
                // Updated colors for filters to match royal blue/purple theme
                const getFilterStyle = () => {
                  switch(filterOption) {
                    case "pending": return "bg-amber-500 hover:bg-amber-600";
                    case "submitted": return "bg-blue-500 hover:bg-blue-600";
                    case "graded": return "bg-emerald-500 hover:bg-emerald-600";
                    case "overdue": return "bg-rose-500 hover:bg-rose-600";
                    default: return "bg-indigo-600 hover:bg-indigo-700";
                  }
                };
                
                const getInactiveStyle = () => {
                  switch(filterOption) {
                    case "pending": return "border-amber-500/30 hover:bg-amber-500/10";
                    case "submitted": return "border-blue-500/30 hover:bg-blue-500/10";
                    case "graded": return "border-emerald-500/30 hover:bg-emerald-500/10";
                    case "overdue": return "border-rose-500/30 hover:bg-rose-500/10";
                    default: return "border-indigo-500/30 hover:bg-indigo-500/10";
                  }
                };
                
                return (
                  <motion.button
                    key={filterOption}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                      filter === filterOption
                        ? `${getFilterStyle()} text-white shadow-md`
                        : `bg-transparent border ${getInactiveStyle()} text-white`
                    }`}
                  >
                    <div className="flex items-center">
                      {filterOption === "all" ? "All" : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                      {filterOption !== "all" && (
                        <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                          {filterOption === "overdue" 
                            ? stats.overdue 
                            : stats[filterOption as keyof AssignmentStats]
                          }
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredAssignments.length === 0 ? (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchTerm || filter !== "all" ? "No assignments found" : "No assignments available"}
                </h3>
                <p className="text-zenith-muted mb-6">
                  {searchTerm || filter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Your assignments will appear here when they're available"
                  }
                </p>
                {(searchTerm || filter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilter("all");
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>
            </div>
          ) : (
            filteredAssignments.map((assignment, index) => {
              const StatusIcon = getStatusIcon(assignment.status);
              const isAssignmentOverdue = assignment.status === "pending" && isOverdue(assignment.dueDate);
              const actualStatus = isAssignmentOverdue ? "overdue" : assignment.status;
              const gradePercentage = assignment.grade ? Math.round((parseFloat(assignment.grade) / assignment.maxPoints) * 100) : 0;
              
              // Updated status badge styling
              const getStatusBadgeStyle = (status: string) => {
                switch (status) {
                  case 'pending': return 'bg-amber-500 text-white';
                  case 'submitted': return 'bg-blue-500 text-white';
                  case 'graded': return 'bg-emerald-500 text-white';
                  case 'overdue': return 'bg-rose-500 text-white';
                  default: return 'bg-slate-500 text-white';
                }
              };
              
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="bg-zenith-darker border border-indigo-900/30 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 h-full flex flex-col">
                    {/* Card Header with Royal Blue Accent */}
                    <div className="relative p-5 bg-gradient-to-r from-indigo-900/40 to-purple-900/30">
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusBadgeStyle(actualStatus)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}</span>
                        </span>
                      </div>

                      {/* Assignment Title */}
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-3 line-clamp-2 pr-20">
                        {assignment.title}
                      </h3>

                      {/* Due Date Info with cleaner styling */}
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-lg text-indigo-300">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Assignment Details */}
                      <div className="mb-4 flex-1 space-y-4">
                        {/* Instructor info */}
                        <div className="flex items-center text-sm text-zenith-muted px-2 py-2">
                          <div className="w-7 h-7 bg-indigo-500/10 rounded-full flex items-center justify-center mr-3">
                            <User className="w-3.5 h-3.5 text-indigo-300" />
                          </div>
                          <span>
                            {typeof assignment.assignedBy === "object" 
                              ? assignment.assignedBy?.name 
                              : (typeof assignment.assignedBy === "string" && 
                                 assignment.assignedBy !== "null" && 
                                 !assignment.assignedBy.startsWith("user_")
                                ? assignment.assignedBy 
                                : "Instructor")}
                          </span>
                        </div>
                        
                        {/* Club info if available */}
                        {assignment.club && (
                          <div className="flex items-center">
                            <div className="px-4 py-2 bg-purple-500/10 rounded-lg text-purple-300 text-sm flex items-center">
                              <BookOpen className="w-4 h-4 mr-2" />
                              <span>
                                {typeof assignment.club === "object" 
                                  ? assignment.club?.name 
                                  : assignment.club || "General"}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Grade display */}
                        {assignment.status === "graded" && assignment.grade && (
                          <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-lg">
                            <div className="flex flex-col">
                              <span className="text-xs text-indigo-300 mb-1.5">Your Grade</span>
                              <div className="flex items-baseline">
                                <span className={`text-xl font-bold ${
                                  gradePercentage >= 80 ? 'text-emerald-400' :
                                  gradePercentage >= 60 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {assignment.grade}
                                </span>
                                <span className="text-xs text-zenith-muted ml-1.5">/{assignment.maxPoints}</span>
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center">
                              <PieChart className={`w-10 h-10 ${
                                gradePercentage >= 80 ? 'text-emerald-400' :
                                gradePercentage >= 60 ? 'text-amber-400' : 'text-rose-400'
                              }`} />
                            </div>
                          </div>
                        )}
                        
                        {/* Feedback section */}
                        {assignment.feedback && assignment.status === "graded" && (
                          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <div className="flex items-center text-yellow-400 text-xs mb-2">
                              <Star className="w-4 h-4 mr-1.5 fill-yellow-400" />
                              <span>Instructor Feedback</span>
                            </div>
                            <p className="text-sm text-zenith-muted line-clamp-2">
                              {assignment.feedback.substring(0, 100)}
                              {assignment.feedback.length > 100 ? "..." : ""}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button - Positioned at bottom */}
                      <div className="mt-auto">
                        {assignment.status === "pending" && (
                          <motion.button 
                            whileHover={{ scale: isOverdue(assignment.dueDate) ? 1 : 1.03 }}
                            whileTap={{ scale: isOverdue(assignment.dueDate) ? 1 : 0.98 }}
                            onClick={() => !isOverdue(assignment.dueDate) && handleStartAssignment(assignment.id)}
                            disabled={startingAssignment === assignment.id || isOverdue(assignment.dueDate)}
                            className={`w-full py-3 ${isOverdue(assignment.dueDate) 
                              ? 'bg-gray-600/50 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30'
                            } text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2`}
                          >
                            {startingAssignment === assignment.id ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Starting...</span>
                              </>
                            ) : isOverdue(assignment.dueDate) ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1.5" />
                                <span>Overdue</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-1.5" />
                                <span>Start Assignment</span>
                              </>
                            )}
                          </motion.button>
                        )}
                        
                        {(assignment.status === "submitted" || assignment.status === "graded") && (
                          <motion.button 
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewResults(assignment.id)}
                            disabled={startingAssignment === assignment.id}
                            className="w-full py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                          >
                            {startingAssignment === assignment.id ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1.5" />
                                <span>View Details</span>
                              </>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ZEN Assistant Modal */}
      <ZenAssistant
        isOpen={showZenAssistant}
        onClose={() => setShowZenAssistant(false)}
        onAssignmentGenerated={handleAssignmentGenerated}
      />
    </div>
  );
}
