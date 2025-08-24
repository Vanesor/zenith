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
      
      const tokenManager = TokenManager.getInstance();
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        ...(selectedClub && { clubId: selectedClub })
      });
      
      const response = await tokenManager.authenticatedFetch(
        `/api/analytics/stats?${params.toString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        // Fallback to mock data if API fails
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
        
        showToast({
          type: 'warning',
          title: 'Using Sample Data',
          message: 'Unable to fetch real analytics data, showing sample data'
        });
      }
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
      setLoading(true);
      const tokenManager = TokenManager.getInstance();
      
      const reportData = {
        type: reportType,
        timeRange: selectedTimeRange,
        ...(reportType === 'club' && selectedClub && { clubId: selectedClub })
      };
      
      const response = await tokenManager.authenticatedFetch('/api/analytics/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Create a downloadable report
        const reportContent = generateReportHTML(data.report);
        const blob = new Blob([reportContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast({
          type: 'success',
          title: 'Report Generated',
          message: 'Analytics report has been downloaded successfully'
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate report'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReportHTML = (report: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin: 30px 0; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .metric-label { font-size: 14px; color: #6b7280; }
            .recommendation { background: #f3f4f6; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; }
            .insight { background: #ecfdf5; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.title}</h1>
            <p>Generated on: ${new Date(report.generatedAt).toLocaleDateString()}</p>
            <p>Period: ${report.period}</p>
            <p>Engagement Score: ${report.engagementScore}/100</p>
          </div>
          
          <div class="section">
            <h2>Executive Summary</h2>
            <p>${report.executiveSummary}</p>
          </div>
          
          <div class="section">
            <h2>Key Metrics</h2>
            ${Object.entries(report.data.stats || report.data.club || {}).map(([key, value]) => 
              `<div class="metric">
                <div class="metric-value">${value}</div>
                <div class="metric-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
               </div>`
            ).join('')}
          </div>
          
          <div class="section">
            <h2>Key Insights</h2>
            ${report.insights.map((insight: string) => `<div class="insight">${insight}</div>`).join('')}
          </div>
          
          <div class="section">
            <h2>Recommendations</h2>
            ${report.recommendations.map((rec: string) => `<div class="recommendation">${rec}</div>`).join('')}
          </div>
          
          ${report.data.topPerformers && report.data.topPerformers.length > 0 ? `
          <div class="section">
            <h2>Top Performers</h2>
            <table>
              <tr><th>Name</th><th>Submissions</th><th>Average Score</th><th>Posts</th><th>Comments</th></tr>
              ${report.data.topPerformers.map((performer: any) => `
                <tr>
                  <td>${performer.name}</td>
                  <td>${performer.submissions}</td>
                  <td>${Math.round(performer.avg_score)}%</td>
                  <td>${performer.posts_created}</td>
                  <td>${performer.comments_made}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}
          
          ${report.data.clubComparison && report.data.clubComparison.length > 0 ? `
          <div class="section">
            <h2>Club Performance Comparison</h2>
            <table>
              <tr><th>Club</th><th>Type</th><th>Members</th><th>Assignments</th><th>Events</th><th>Average Score</th></tr>
              ${report.data.clubComparison.map((club: any) => `
                <tr>
                  <td>${club.name}</td>
                  <td>${club.type}</td>
                  <td>${club.members}</td>
                  <td>${club.assignments}</td>
                  <td>${club.events}</td>
                  <td>${Math.round(club.avg_score)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  if (!hasAnalyticsAccess) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Access Denied</h2>
            <p className="text-secondary">You do not have permission to access analytics</p>
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
      title: 'Assignment Success',
      value: `${analyticsData.assignmentStats.submissionRate.toFixed(1)}%`,
      change: `${analyticsData.assignmentStats.submitted}/${analyticsData.assignmentStats.total}`,
      trend: 'up',
      icon: CheckCircle,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Avg Attendance',
      value: `${analyticsData.clubStats.averageAttendance.toFixed(1)}%`,
      trend: 'up',
      icon: FileText,
      color: 'from-teal-500 to-cyan-500'
    },
    {
      title: 'Engagement Score',
      value: analyticsData.engagementMetrics.overallEngagement,
      change: `${analyticsData.engagementMetrics.postsThisMonth} posts`,
      trend: 'up',
      icon: Award,
      color: 'from-indigo-500 to-purple-500'
    }
  ] : [];

  return (
    <LayoutWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-secondary mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Range Filter */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>

            {/* Club Filter - Only for zenith committee */}
            {user?.role === 'zenith_committee' && (
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="px-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Clubs</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={() => fetchAnalyticsData()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-secondary">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    {card.trend && (
                      <div className={`text-sm font-medium ${
                        card.trend === 'up' ? 'text-green-600' : 
                        card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {card.trend === 'up' ? '↗' : card.trend === 'down' ? '↘' : '→'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-primary mb-1">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                    <p className="text-sm text-secondary font-medium mb-2">{card.title}</p>
                    {card.change && (
                      <p className="text-xs text-muted">{card.change}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts and Detailed Analytics */}
            {analyticsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Statistics */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Assignment Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Submitted</span>
                      <span className="font-semibold text-green-600">
                        {analyticsData.assignmentStats.submitted}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        {analyticsData.assignmentStats.pending}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Overdue</span>
                      <span className="font-semibold text-red-600">
                        {analyticsData.assignmentStats.overdue}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Average Score</span>
                        <span className="font-semibold text-primary">
                          {analyticsData.assignmentStats.averageScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Event Statistics */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Analytics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Total Events</span>
                      <span className="font-semibold text-primary">
                        {analyticsData.eventStats.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Upcoming</span>
                      <span className="font-semibold text-blue-600">
                        {analyticsData.eventStats.upcoming}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Completed</span>
                      <span className="font-semibold text-green-600">
                        {analyticsData.eventStats.completed}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Avg Attendance</span>
                        <span className="font-semibold text-primary">
                          {analyticsData.eventStats.averageAttendance.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Top Contributors */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Contributors
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.memberStats.topContributors.map((contributor, index) => (
                      <div key={contributor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-primary">{contributor.name}</span>
                        </div>
                        <span className="text-secondary font-semibold">
                          {contributor.contributions} contributions
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Popular Event Types */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Popular Event Types
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.eventStats.popularEventTypes.map((eventType, index) => (
                      <div key={eventType.type} className="flex items-center justify-between">
                        <span className="text-secondary">{eventType.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ 
                                width: `${(eventType.count / Math.max(...analyticsData.eventStats.popularEventTypes.map(e => e.count))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-primary w-8">
                            {eventType.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Report Generation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generate Reports
              </h3>
              <p className="text-secondary mb-4">
                Generate comprehensive analytics reports with detailed insights and recommendations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => generateReport('club')}
                  disabled={loading || !selectedClub}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Club Report
                </Button>
                
                {user?.role === 'zenith_committee' && (
                  <Button
                    onClick={() => generateReport('overall')}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    System Report
                  </Button>
                )}
              </div>
              
              {!selectedClub && (
                <p className="text-sm text-muted mt-2">
                  Select a club to generate club-specific reports
                </p>
              )}
            </motion.div>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}