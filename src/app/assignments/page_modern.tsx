"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Trophy,
  AlertTriangle,
  Calendar,
  Users,
  Search,
  Filter,
  Eye,
  Play,
  CheckCircle2,
  Star,
  TrendingUp,
  Zap,
  Target,
  Award,
  Timer,
  ArrowRight,
  MoreHorizontal,
  Sparkles,
  Brain,
  Lightbulb,
  Rocket,
  Code,
  FileText,
  Download,
  Share2,
  Heart,
  Bookmark,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TokenManager from "@/lib/TokenManager";

interface Assignment {
  id: string;
  title: string;
  description: string;
  club: string | { id: string; name: string; color?: string; icon?: string } | null;
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
  difficulty?: "easy" | "medium" | "hard";
  type?: "quiz" | "project" | "coding" | "essay" | "presentation";
  estimatedTime?: number;
  submissions?: Array<{
    id: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
    status: string;
  }>;
}

const ModernAssignmentsPage = () => {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({
    redirectReason: "Please sign in to view your assignments and tasks",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("dueDate");

  // Sample data for visual demonstration
  const sampleAssignments: Assignment[] = [
    {
      id: "1",
      title: "React Component Architecture",
      description: "Build a complex React application with proper component structure",
      club: { id: "tech", name: "Tech Club", color: "#3B82F6", icon: "💻" },
      assignedBy: { id: "1", name: "Dr. Smith" },
      dueDate: "2025-08-25T23:59:59",
      status: "pending",
      maxPoints: 100,
      instructions: "Create a modular React application",
      created_at: "2025-08-15T10:00:00",
      difficulty: "hard",
      type: "coding",
      estimatedTime: 180,
    },
    {
      id: "2",
      title: "UI/UX Design Principles",
      description: "Design a modern user interface following best practices",
      club: { id: "design", name: "Design Club", color: "#EC4899", icon: "🎨" },
      assignedBy: { id: "2", name: "Prof. Johnson" },
      dueDate: "2025-08-22T23:59:59",
      status: "submitted",
      grade: "85",
      maxPoints: 100,
      instructions: "Create wireframes and prototypes",
      created_at: "2025-08-10T14:00:00",
      difficulty: "medium",
      type: "project",
      estimatedTime: 120,
      submittedAt: "2025-08-20T15:30:00",
    },
    {
      id: "3",
      title: "Data Structures Quiz",
      description: "Test your knowledge of arrays, linked lists, and trees",
      club: { id: "cs", name: "Computer Science", color: "#10B981", icon: "🧮" },
      assignedBy: { id: "3", name: "Dr. Williams" },
      dueDate: "2025-08-20T10:00:00",
      status: "graded",
      grade: "92",
      maxPoints: 100,
      instructions: "Complete the online quiz",
      created_at: "2025-08-12T09:00:00",
      difficulty: "easy",
      type: "quiz",
      estimatedTime: 45,
      submittedAt: "2025-08-19T09:15:00",
    },
  ];

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user || !isAuthenticated) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/assignments");

        if (response.ok) {
          const data = await response.json();
          const transformedAssignments = data.map((assignment: any) => ({
            ...assignment,
            difficulty: assignment.difficulty || "medium",
            type: assignment.type || "project",
            estimatedTime: assignment.estimatedTime || 60,
          }));
          setAssignments(transformedAssignments);
        } else {
          setAssignments(sampleAssignments); // Fallback to sample data
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setAssignments(sampleAssignments); // Fallback to sample data
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user, isAuthenticated]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Timer className="w-5 h-5" />;
      case "submitted":
        return <CheckCircle2 className="w-5 h-5" />;
      case "graded":
        return <Trophy className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "from-green-400 to-emerald-500";
      case "medium":
        return "from-yellow-400 to-orange-500";
      case "hard":
        return "from-red-400 to-pink-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "coding":
        return <Code className="w-6 h-6" />;
      case "quiz":
        return <Brain className="w-6 h-6" />;
      case "project":
        return <Rocket className="w-6 h-6" />;
      case "essay":
        return <FileText className="w-6 h-6" />;
      case "presentation":
        return <Users className="w-6 h-6" />;
      default:
        return <BookOpen className="w-6 h-6" />;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesFilter = activeFilter === "all" || assignment.status === activeFilter;
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === "pending").length,
    submitted: assignments.filter(a => a.status === "submitted").length,
    graded: assignments.filter(a => a.status === "graded").length,
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-6 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Your Assignments
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Master your skills with engaging assignments designed for success
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Total", value: stats.total, icon: Target, color: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" },
              { label: "Pending", value: stats.pending, icon: Timer, color: "from-orange-500 to-red-500", bg: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20" },
              { label: "Submitted", value: stats.submitted, icon: CheckCircle2, color: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" },
              { label: "Graded", value: stats.graded, icon: Trophy, color: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20" },
            ].map((stat, index) => (
              <div key={index} className={`relative p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border border-white/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3">
              {[
                { key: "all", label: "All", icon: Target },
                { key: "pending", label: "Pending", icon: Timer },
                { key: "submitted", label: "Submitted", icon: CheckCircle2 },
                { key: "graded", label: "Graded", icon: Trophy },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeFilter === filter.key
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No assignments found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAssignments.map((assignment, index) => {
              const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === "pending";
              const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={assignment.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="relative">
                    <div className={`h-32 bg-gradient-to-r ${assignment.club && typeof assignment.club === 'object' ? 
                      `from-[${assignment.club.color}] to-[${assignment.club.color}]/80` : 
                      'from-blue-500 to-purple-500'} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getDifficultyColor(assignment.difficulty || 'medium')} flex items-center justify-center shadow-lg`}>
                          {getTypeIcon(assignment.type || 'project')}
                        </div>
                        <span className="text-white font-medium text-sm px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                          {(assignment.difficulty || 'medium').charAt(0).toUpperCase() + (assignment.difficulty || 'medium').slice(1)}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-lg`}>
                            {assignment.club && typeof assignment.club === 'object' ? assignment.club.icon : '📚'}
                          </div>
                          <span className="text-white font-medium">
                            {assignment.club && typeof assignment.club === 'object' ? assignment.club.name : 'General'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-white">
                          {getStatusIcon(assignment.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {assignment.title}
                      </h3>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2">
                      {assignment.description}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Timer className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Time</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {assignment.estimatedTime || 60}m
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Points</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {assignment.grade ? `${assignment.grade}/` : ''}{assignment.maxPoints}
                        </p>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className={`flex items-center gap-2 mb-6 p-3 rounded-xl ${
                      isOverdue 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                        : daysLeft <= 3 
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (assignment.status === 'pending') {
                          router.push(`/assignments/${assignment.id}/take`);
                        } else {
                          router.push(`/assignments/${assignment.id}/view`);
                        }
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                        assignment.status === 'pending'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                          : assignment.status === 'submitted'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {assignment.status === 'pending' ? (
                        <>
                          <Play className="w-4 h-4" />
                          Start Assignment
                        </>
                      ) : assignment.status === 'submitted' ? (
                        <>
                          <Eye className="w-4 h-4" />
                          View Submission
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4" />
                          View Results
                        </>
                      )}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Create Assignment */}
      {user && ['admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 
        'vice_president', 'instructor', 'teacher', 'staff', 'management'].includes(user.role) && (
        <button
          onClick={() => router.push('/assignments/create')}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-110 flex items-center justify-center z-50"
        >
          <Lightbulb className="w-8 h-8" />
        </button>
      )}

      <ZenChatbot />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ModernAssignmentsPage;
