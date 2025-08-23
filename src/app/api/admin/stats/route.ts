// Server-side file to handle API requests for the admin dashboard

import { verifyAuth } from "@/lib/auth-unified";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// Types for analytics data
interface AdminStatsResponse {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalAssignments: number;
  totalComments: number;
  totalPosts: number;
  weeklyStats: {
    newUsers: number;
    newEvents: number;
    newAssignments: number;
    newPosts: number;
  };
  usersByRole: {
    admin: number;
    coordinator: number;
    committee_member: number;
    student: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
}

interface ClubStatsResponse {
  members: number;
  events: number;
  assignments: number;
  posts: number;
  recentActivity: Array<{
    type: string;
    title: string;
    date: string;
  }>;
}

async function fetchAdminStats(): Promise<AdminStatsResponse> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get total counts using SQL queries
    const totalCountsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
        (SELECT COUNT(*) FROM clubs WHERE deleted_at IS NULL) as total_clubs,
        (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) as total_events,
        (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL) as total_assignments,
        (SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) as total_comments,
        (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) as total_posts
    `);

    const totals = totalCountsQuery.rows[0];

    // Get weekly stats using SQL queries
    const weeklyCountsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at >= $1 AND deleted_at IS NULL) as weekly_users,
        (SELECT COUNT(*) FROM events WHERE created_at >= $1 AND deleted_at IS NULL) as weekly_events,
        (SELECT COUNT(*) FROM assignments WHERE created_at >= $1 AND deleted_at IS NULL) as weekly_assignments,
        (SELECT COUNT(*) FROM posts WHERE created_at >= $1 AND deleted_at IS NULL) as weekly_posts
    `, [oneWeekAgo]);

    const weekly = weeklyCountsQuery.rows[0];

    // Get users by role using SQL query
    const usersByRoleResult = await db.query(`
      SELECT role, COUNT(*) as count
      FROM users 
      WHERE deleted_at IS NULL
      GROUP BY role
    `);

    const roleStats = {
      admin: 0,
      coordinator: 0,
      committee_member: 0,
      student: 0
    };

    usersByRoleResult.rows.forEach((group: { role: string; count: string }) => {
      if (group.role in roleStats) {
        roleStats[group.role as keyof typeof roleStats] = parseInt(group.count);
      }
    });

    // Get recent activities from user_activities table
    const recentActivitiesResult = await db.query(`
      SELECT 
        ua.id,
        ua.action,
        ua.created_at,
        ua.details,
        ua.target_name,
        u.name as user_name,
        u.email as user_email
      FROM user_activities ua
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE ua.deleted_at IS NULL
      ORDER BY ua.created_at DESC
      LIMIT 10
    `);

    return {
      totalUsers: parseInt(totals.total_users),
      totalClubs: parseInt(totals.total_clubs),
      totalEvents: parseInt(totals.total_events),
      totalAssignments: parseInt(totals.total_assignments),
      totalComments: parseInt(totals.total_comments),
      totalPosts: parseInt(totals.total_posts),
      weeklyStats: {
        newUsers: parseInt(weekly.weekly_users),
        newEvents: parseInt(weekly.weekly_events),
        newAssignments: parseInt(weekly.weekly_assignments),
        newPosts: parseInt(weekly.weekly_posts)
      },
      usersByRole: roleStats,
      recentActivities: recentActivitiesResult.rows.map((activity: any) => ({
        id: activity.id.toString(),
        action: activity.action,
        user: activity.user_name || 'Unknown User',
        timestamp: activity.created_at?.toISOString() || '',
        details: activity.details ? JSON.stringify(activity.details) : activity.target_name || ''
      }))
    };
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

async function fetchClubStats(clubId: string): Promise<ClubStatsResponse> {
  try {
    // Get club stats using SQL queries
    const clubStatsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM club_members WHERE club_id = $1 AND status = 'active') as members,
        (SELECT COUNT(*) FROM events WHERE club_id = $1 AND deleted_at IS NULL) as events,
        (SELECT COUNT(*) FROM assignments WHERE club_id = $1 AND deleted_at IS NULL) as assignments,
        (SELECT COUNT(*) FROM posts WHERE club_id = $1 AND deleted_at IS NULL) as posts
    `, [clubId]);

    const stats = clubStatsQuery.rows[0];

    // Get recent activity
    const recentEventsResult = await db.query(`
      SELECT title, created_at 
      FROM events 
      WHERE club_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `, [clubId]);

    const recentAssignmentsResult = await db.query(`
      SELECT title, created_at 
      FROM assignments 
      WHERE club_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `, [clubId]);

    const recentActivity = [
      ...recentEventsResult.rows.map((event: any) => ({
        type: 'event',
        title: event.title,
        date: event.created_at?.toISOString() || ''
      })),
      ...recentAssignmentsResult.rows.map((assignment: any) => ({
        type: 'assignment',
        title: assignment.title,
        date: assignment.created_at?.toISOString() || ''
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      members: parseInt(stats.members),
      events: parseInt(stats.events),
      assignments: parseInt(stats.assignments),
      posts: parseInt(stats.posts),
      recentActivity
    };
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user!;
    
    // Check if user has admin permissions
    if (!['admin', 'coordinator', 'committee_member'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'admin';
    const clubId = searchParams.get('clubId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Route to appropriate handler
    switch (type) {
      case 'admin':
        if (user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Forbidden: Admin role required' },
            { status: 403 }
          );
        }
        const stats = await fetchAdminStats();
        return NextResponse.json(stats);
        
      case 'club':
        if (!clubId) {
          return NextResponse.json(
            { error: 'Club ID is required for club stats' },
            { status: 400 }
          );
        }
        
        // Check if user can access this club's stats
        if (user.role !== 'admin' && user.club_id !== clubId) {
          return NextResponse.json(
            { error: 'Forbidden: Cannot access other club stats' },
            { status: 403 }
          );
        }
        
        const clubStats = await fetchClubStats(clubId);
        return NextResponse.json(clubStats);
        
      default:
        return NextResponse.json(
          { error: 'Invalid stats type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
