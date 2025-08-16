// Server-side file to handle API requests for the admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Types for analytics data
interface AdminStatsResponse {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalAssignments: number;
  activeUsers: number;
  recentJoins: number;
  pendingAssignments: number;
  userGrowth: {
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
  assignmentGrowth: {
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
  eventGrowth: {
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
  engagementRate: {
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  };
}

interface ClubStatistics {
  id: string;
  name: string;
  memberCount: number;
  eventCount: number;
  assignmentCount: number;
  engagement: number;
  growthRate?: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  timestamp: string;
  details?: string;
}

// Handler for fetching admin dashboard statistics
export async function GET(req: NextRequest) {
  try {
    // Verify user has admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user role and permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_committee_member, is_coordinator')
      .eq('id', user.id)
      .single();
      
    if (userError || !(userData?.role === 'admin' || userData?.is_committee_member || userData?.is_coordinator)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Get URL parameters
    const url = new URL(req.url);
    const dataType = url.searchParams.get('data') || 'all';
    const clubId = url.searchParams.get('clubId');
    
    let responseData: any = {};
    
    // Fetch appropriate data based on request parameters
    if (dataType === 'all' || dataType === 'stats') {
      const stats = await fetchAdminStats(supabase);
      responseData.stats = stats;
    }
    
    if (dataType === 'all' || dataType === 'clubs') {
      const clubs = await fetchClubStats(supabase, clubId);
      responseData.clubs = clubs;
    }
    
    if (dataType === 'all' || dataType === 'activity') {
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      const activities = await fetchRecentActivities(supabase, limit);
      responseData.activities = activities;
    }
    
    if (dataType === 'all' || dataType === 'assignments') {
      const assignments = await fetchAssignmentStats(supabase, clubId);
      responseData.assignments = assignments;
    }
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to fetch overall admin statistics
async function fetchAdminStats(supabase: any): Promise<AdminStatsResponse> {
  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  // Get total clubs
  const { count: totalClubs } = await supabase
    .from('clubs')
    .select('*', { count: 'exact', head: true });
  
  // Get total events
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  // Get total assignments
  const { count: totalAssignments } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true });
    
  // Get active users (logged in within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('last_login', sevenDaysAgo.toISOString());
    
  // Get recent joins (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: recentJoins } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('created_at', thirtyDaysAgo.toISOString());
    
  // Get pending assignments
  const { count: pendingAssignments } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .gt('due_date', new Date().toISOString());
    
  // Calculate growth percentages and trends
  // Note: In a real implementation, you would compare with previous period data
  
  return {
    totalUsers,
    totalClubs,
    totalEvents,
    totalAssignments,
    activeUsers,
    recentJoins,
    pendingAssignments,
    userGrowth: {
      change: '+12%', // This would be calculated from actual data
      trend: 'up'
    },
    assignmentGrowth: {
      change: '+5%',
      trend: 'up'
    },
    eventGrowth: {
      change: '-2%',
      trend: 'down'
    },
    engagementRate: {
      value: '73%',
      change: '+8%',
      trend: 'up'
    }
  };
}

// Function to fetch club statistics
async function fetchClubStats(supabase: any, clubId?: string | null): Promise<ClubStatistics[]> {
  let query = supabase.from('clubs').select(`
    id,
    name,
    member_count,
    created_at,
    events (id),
    assignments (id)
  `);
  
  if (clubId) {
    query = query.eq('id', clubId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map((club: any) => ({
    id: club.id,
    name: club.name,
    memberCount: club.member_count,
    eventCount: club.events.length,
    assignmentCount: club.assignments.length,
    engagement: calculateClubEngagement(club), // Function to calculate engagement based on various metrics
  }));
}

// Helper function to calculate club engagement
function calculateClubEngagement(club: any): number {
  // In a real implementation, this would be based on:
  // - Event attendance rates
  // - Assignment submission rates
  // - Comment and interaction metrics
  // - Active vs. inactive member ratio
  
  // For now, returning a random engagement score between 50-95%
  return Math.floor(50 + Math.random() * 45);
}

// Function to fetch recent activities
async function fetchRecentActivities(supabase: any, limit: number = 10): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from('user_activities')
    .select(`
      id,
      user_id,
      action,
      target_type,
      target_id,
      target_name,
      created_at,
      details,
      users (name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  
  return data.map((activity: any) => ({
    id: activity.id,
    userId: activity.user_id,
    userName: activity.users?.name || 'Unknown User',
    userAvatar: activity.users?.avatar_url,
    action: activity.action,
    targetType: activity.target_type,
    targetId: activity.target_id,
    targetName: activity.target_name,
    timestamp: activity.created_at,
    details: activity.details
  }));
}

// Function to fetch assignment statistics
async function fetchAssignmentStats(supabase: any, clubId?: string | null) {
  let query = supabase.from('assignments').select(`
    id,
    title,
    club_id,
    clubs (name),
    due_date,
    submission_count,
    total_members,
    average_score
  `);
  
  if (clubId) {
    query = query.eq('club_id', clubId);
  }
  
  const { data, error } = await query
    .order('due_date', { ascending: true })
    .limit(10);
    
  if (error) throw error;
  
  return data.map((assignment: any) => ({
    id: assignment.id,
    title: assignment.title,
    clubId: assignment.club_id,
    clubName: assignment.clubs.name,
    dueDate: assignment.due_date,
    submissionCount: assignment.submission_count || 0,
    totalMembers: assignment.total_members || 0,
    averageScore: assignment.average_score || 0
  }));
}
