"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Users,
  FileText,
  Calendar,
  Award,
  TrendingUp,
  Download,
  ArrowLeft,
  Eye,
  Edit,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import TokenManager from "@/lib/TokenManager";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ClubStats {
  club: {
    id: string;
    name: string;
    description: string;
    type: string;
    created_at: string;
    status: string;
    coordinator_name: string;
    coordinator_email: string;
  };
  memberStats: {
    total: number;
    active: number;
    newThisMonth: number;
    roles: string;
  };
  assignmentStats: {
    total: number;
    active: number;
    overdue: number;
    averageScore: number;
  };
  eventStats: {
    total: number;
    upcoming: number;
    completed: number;
    averageAttendance: number;
  };
  recentAssignments: any[];
  recentEvents: any[];
  topMembers: any[];
}

export default function ClubDetailPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  
  const [loading, setLoading] = useState(true);
  const [clubStats, setClubStats] = useState<ClubStats | null>(null);

  // Check if user has access
  const hasAdminAccess = user && [
    'president', 'vice_president', 'innovation_head', 'treasurer', 'outreach', 'zenith_committee'
  ].includes(user.role);

  useAuthGuard();

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasAdminAccess) {
        showToast({
          type: "error",
          title: "Access Denied",
          message: "You don't have permission to access this page"
        });
        router.push("/dashboard");
        return;
      }
      
      fetchClubStats();
    }
  }, [isLoading, user, hasAdminAccess, clubId]);

  const fetchClubStats = async () => {
    try {
      setLoading(true);
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/admin/clubs/${clubId}/stats`);

      if (response.ok) {
        const data = await response.json();
        setClubStats(data.stats);
      } else {
        throw new Error("Failed to fetch club statistics");
      }
    } catch (error) {
      console.error("Error fetching club stats:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load club statistics"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateClubReport = async () => {
    try {
      showToast({
        type: "success",
        title: "Report Generated",
        message: "Club report with Gemini AI insights is being prepared"
      });
    } catch (error) {
      console.error("Error generating report:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to generate report"
      });
    }
  };

  if (!hasAdminAccess) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold zenith-text-primary mb-2">Access Denied</h2>
            <p className="zenith-text-secondary">You do not have permission to access this page</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!clubStats) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold zenith-text-primary mb-2">Club Not Found</h2>
            <p className="zenith-text-secondary">The requested club could not be found</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold zenith-text-primary">{clubStats.club.name}</h1>
              <p className="zenith-text-secondary">{clubStats.club.type} Club • {clubStats.club.status}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/clubs/${clubId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Club
            </Button>
            <Button
              variant="gradient"
              onClick={generateClubReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold zenith-text-primary mb-1">{clubStats.memberStats.total}</p>
              <p className="text-sm zenith-text-secondary">Total Members</p>
              <p className="text-sm text-green-500 mt-1">{clubStats.memberStats.active} active</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold zenith-text-primary mb-1">{clubStats.assignmentStats.total}</p>
              <p className="text-sm zenith-text-secondary">Total Assignments</p>
              <p className="text-sm text-blue-500 mt-1">{clubStats.assignmentStats.active} active</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold zenith-text-primary mb-1">{clubStats.eventStats.total}</p>
              <p className="text-sm zenith-text-secondary">Total Events</p>
              <p className="text-sm text-purple-500 mt-1">{clubStats.eventStats.upcoming} upcoming</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold zenith-text-primary mb-1">{clubStats.assignmentStats.averageScore.toFixed(1)}%</p>
              <p className="text-sm zenith-text-secondary">Average Score</p>
              <p className="text-sm text-green-500 mt-1">Performance</p>
            </div>
          </motion.div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Assignments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold zenith-text-primary">Recent Assignments</h3>
            </div>
            
            <div className="space-y-3">
              {clubStats.recentAssignments.length === 0 ? (
                <p className="zenith-text-secondary text-center py-4">No assignments found</p>
              ) : (
                clubStats.recentAssignments.slice(0, 5).map((assignment: any) => (
                  <div key={assignment.id} className="flex justify-between items-center p-3 rounded-xl zenith-bg-primary">
                    <div>
                      <p className="font-semibold zenith-text-primary">{assignment.title}</p>
                      <p className="text-sm zenith-text-secondary">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold zenith-text-primary">{assignment.submission_count} submissions</p>
                      <p className="text-xs zenith-text-secondary">{assignment.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold zenith-text-primary">Recent Events</h3>
            </div>
            
            <div className="space-y-3">
              {clubStats.recentEvents.length === 0 ? (
                <p className="zenith-text-secondary text-center py-4">No events found</p>
              ) : (
                clubStats.recentEvents.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="flex justify-between items-center p-3 rounded-xl zenith-bg-primary">
                    <div>
                      <p className="font-semibold zenith-text-primary">{event.title}</p>
                      <p className="text-sm zenith-text-secondary">
                        {new Date(event.event_date).toLocaleDateString()} • {event.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold zenith-text-primary">
                        {event.attendees_count}{event.max_attendees ? `/${event.max_attendees}` : ''} attendees
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Top Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold zenith-text-primary">Top Contributors</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubStats.topMembers.length === 0 ? (
                <p className="zenith-text-secondary text-center py-4 col-span-full">No members found</p>
              ) : (
                clubStats.topMembers.slice(0, 6).map((member: any, index: number) => (
                  <div key={member.id} className="flex items-center gap-3 p-4 rounded-xl zenith-bg-primary">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold zenith-text-primary">{member.name}</p>
                      <p className="text-sm zenith-text-secondary capitalize">{member.role}</p>
                      <p className="text-xs text-green-500">
                        {member.submission_count} submissions • {member.event_attendance} events
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
