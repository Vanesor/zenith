"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/contexts/ToastContext';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import TokenManager from '@/lib/TokenManager';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  clubStats: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    upcomingEvents: number;
    totalAssignments: number;
    completedAssignments: number;
    averageAttendance: number;
    memberGrowth: number;
  };
  assignmentStats: {
    total: number;
    submitted: number;
    pending: number;
    overdue: number;
    averageScore: number;
    submissionRate: number;
  };
  eventStats: {
    total: number;
    upcoming: number;
    completed: number;
    averageAttendance: number;
    popularEventTypes: { type: string; count: number }[];
  };
  memberStats: {
    total: number;
    newThisMonth: number;
    activeThisWeek: number;
    retentionRate: number;
    topContributors: { name: string; contributions: number }[];
  };
  engagementMetrics: {
    postsThisMonth: number;
    commentsThisMonth: number;
    likesThisMonth: number;
    overallEngagement: number;
  };
}

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [selectedClub, setSelectedClub] = useState('');
  const [clubs, setClubs] = useState<any[]>([]);

  // Check if user has access to analytics
  const hasAnalyticsAccess = user && [
    'coordinator', 'co_coordinator', 'president', 'vice_president',
    'innovation_head', 'treasurer', 'outreach', 'zenith_committee'
  ].includes(user.role);

  useAuthGuard();

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasAnalyticsAccess) {
        showToast({
          type: 'error',
          title: 'Access Denied',
          message: 'You do not have permission to access analytics'
        });
        return;
      }
      
      fetchClubs();
      fetchAnalyticsData();
    }
  }, [isLoading, user, selectedTimeRange, selectedClub]);

  const fetchClubs = async () => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch('/api/clubs');
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
        
        // Set default club to user's club if they're not zenith committee
        if (user?.club_id && user.role !== 'zenith_committee') {
          setSelectedClub(user.club_id);
        }
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // For now, simulate analytics data until the API is implemented
      const mockData: AnalyticsData = {
        clubStats: {
          totalMembers: 150,
          activeMembers: 125,
          totalEvents: 24,
          upcomingEvents: 6,
          totalAssignments: 18,
          completedAssignments: 15,
          averageAttendance: 85.5,
          memberGrowth: 12.5
        },
        assignmentStats: {
          total: 18,
          submitted: 15,
          pending: 2,
          overdue: 1,
          averageScore: 87.3,
          submissionRate: 83.3
        },
        eventStats: {
          total: 24,
          upcoming: 6,
          completed: 18,
          averageAttendance: 85.5,
          popularEventTypes: [
            { type: 'Workshop', count: 10 },
            { type: 'Seminar', count: 8 },
            { type: 'Competition', count: 6 }
          ]
        },
        memberStats: {
          total: 150,
          newThisMonth: 12,
          activeThisWeek: 89,
          retentionRate: 92.5,
          topContributors: [
            { name: 'John Doe', contributions: 25 },
            { name: 'Jane Smith', contributions: 22 },
            { name: 'Mike Johnson', contributions: 18 }
          ]
        },
        engagementMetrics: {
          postsThisMonth: 45,
          commentsThisMonth: 156,
          likesThisMonth: 234,
          overallEngagement: 78
        }
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load analytics data'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: 'club' | 'overall') => {
    try {
      showToast({
        type: 'success',
        title: 'Report Generated',
        message: 'Report generation feature will be implemented with Gemini API'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate report'
      });
    }
  };

  if (!hasAnalyticsAccess) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold zenith-text-primary mb-2">Access Denied</h2>
            <p className="zenith-text-secondary">You do not have permission to access analytics</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  const statCards: StatCard[] = analyticsData ? [
    {
      title: 'Total Members',
      value: analyticsData.clubStats.totalMembers,
      change: `+${analyticsData.clubStats.memberGrowth}%`,
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'Active Members',
      value: analyticsData.clubStats.activeMembers,
      change: `${((analyticsData.clubStats.activeMembers / analyticsData.clubStats.totalMembers) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-blue-500'
    },
    {
      title: 'Total Events',
      value: analyticsData.clubStats.totalEvents,
      change: `${analyticsData.clubStats.upcomingEvents} upcoming`,
      trend: 'up',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Assignment Completion',
      value: `${analyticsData.assignmentStats.submissionRate.toFixed(1)}%`,
      change: `${analyticsData.assignmentStats.submitted}/${analyticsData.assignmentStats.total}`,
      trend: 'up',
      icon: FileText,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Average Attendance',
      value: `${analyticsData.clubStats.averageAttendance.toFixed(1)}%`,
      trend: 'up',
      icon: CheckCircle,
      color: 'from-teal-500 to-green-500'
    },
    {
      title: 'Engagement Score',
      value: analyticsData.engagementMetrics.overallEngagement,
      change: `${analyticsData.engagementMetrics.postsThisMonth} posts`,
      trend: 'up',
      icon: Award,
      color: 'from-pink-500 to-purple-500'
    }
  ] : [];

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold zenith-text-primary">Analytics Dashboard</h1>
            <p className="zenith-text-secondary">Monitor club performance and member engagement</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Time Range Filter */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>

            {/* Club Filter (only for zenith committee) */}
            {user?.role === 'zenith_committee' && (
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="px-4 py-2 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Clubs</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            )}

            <Button
              variant="ghost"
              onClick={fetchAnalyticsData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="gradient"
              onClick={() => generateReport(selectedClub ? 'club' : 'overall')}
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 zenith-bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up' ? 'text-green-500' : 
                      stat.trend === 'down' ? 'text-red-500' : 'zenith-text-secondary'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-2xl font-bold zenith-text-primary mb-1">{stat.value}</p>
                  <p className="text-sm zenith-text-secondary">{stat.title}</p>
                  {stat.change && (
                    <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detailed Analytics */}
        {analyticsData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold zenith-text-primary">Assignment Performance</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Total Assignments</span>
                  <span className="font-semibold zenith-text-primary">{analyticsData.assignmentStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Submitted</span>
                  <span className="font-semibold text-green-500">{analyticsData.assignmentStats.submitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Pending</span>
                  <span className="font-semibold text-yellow-500">{analyticsData.assignmentStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Overdue</span>
                  <span className="font-semibold text-red-500">{analyticsData.assignmentStats.overdue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Average Score</span>
                  <span className="font-semibold zenith-text-primary">{analyticsData.assignmentStats.averageScore.toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>

            {/* Member Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold zenith-text-primary">Member Insights</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Total Members</span>
                  <span className="font-semibold zenith-text-primary">{analyticsData.memberStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">New This Month</span>
                  <span className="font-semibold text-green-500">{analyticsData.memberStats.newThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Active This Week</span>
                  <span className="font-semibold text-blue-500">{analyticsData.memberStats.activeThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="zenith-text-secondary">Retention Rate</span>
                  <span className="font-semibold zenith-text-primary">{analyticsData.memberStats.retentionRate.toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>

            {/* Top Contributors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="zenith-bg-secondary rounded-2xl p-6 border zenith-border-primary lg:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold zenith-text-primary">Top Contributors</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.memberStats.topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3 p-4 rounded-xl zenith-bg-primary">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold zenith-text-primary">{contributor.name}</p>
                      <p className="text-sm zenith-text-secondary">{contributor.contributions} contributions</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}