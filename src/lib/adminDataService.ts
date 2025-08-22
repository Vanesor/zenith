/**
 * Admin Dashboard Data Service
 * 
 * This module provides functions to fetch and process data for the admin dashboard
 * with optimized database queries and proper error handling
 */

import { db } from '@/lib/database';

// Type definitions
type ReportType = 'user' | 'club';

export interface UserDataInterface {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  avatar?: string | null;
  bio?: string | null;
  status?: string;
  club?: string;
  clubMembers?: Array<{
    club: {
      id: string;
      name: string;
      type: string;
    }
  }>;
  statistics?: {
    assignments?: {
      total: number;
      submissions: number;
      averageScore: number;
    };
    events?: {
      total: number;
      attended: number;
      attendanceRate: number;
    };
  };
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ClubDetails {
  id: string;
  name: string;
  type: string;
  description?: string;
  coordinator?: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  stats?: {
    members: { total_members: number };
    assignments: { total_assignments: number; average_submission_rate: number };
    events: { total_events: number; average_attendance: number };
  };
  members?: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    date: string;
    location: string;
  }>;
}

interface ClubData {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  coordinator: string;
  engagement?: number;
  eventCount?: number;
  assignmentCount?: number;
}

interface AssignmentStats {
  total_submissions: number;
  average_score: number;
}

interface EventStats {
  total_attendances: number;
}

interface MemberStats {
  total_members: number;
}

interface ClubAssignmentStats {
  total_assignments: number;
  average_submission_rate: number;
}

interface ClubEventStats {
  total_events: number;
  average_attendance: number;
}

// Get member statistics with real database data
export async function getMemberStats() {
  try {
    // Get member stats with their roles
    const memberStats = await db.query(`
      SELECT 
        role, 
        COUNT(*) as count
      FROM 
        users
      WHERE 
        deleted_at IS NULL
      GROUP BY 
        role
      ORDER BY 
        count DESC
    `);
    
    return {
      success: true,
      data: memberStats.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    throw new Error('Failed to fetch member statistics');
  }
}

// Get club details with real database data
export async function getClubDetails(clubId: string) {
  try {
    // Get club data with coordinator
    const clubResult = await db.query(`
      SELECT 
        c.*,
        u.id as coordinator_id,
        u.name as coordinator_name,
        u.email as coordinator_email
      FROM 
        clubs c
      LEFT JOIN 
        users u ON c.coordinator_id = u.id
      WHERE 
        c.id = $1 AND c.deleted_at IS NULL
    `, [clubId]);
    
    if (clubResult.rows.length === 0) {
      throw new Error('Club not found');
    }
    
    const clubData = clubResult.rows[0];
    
    // Get member statistics
    const memberStats = await db.query(`
      SELECT COUNT(*) as total_members
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1 
        AND cm.status = 'active'
        AND u.deleted_at IS NULL
    `, [clubId]);
    
    // Get member list with recent activity
    const membersResult = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        cm.joined_at,
        cm.status,
        u.last_login_at
      FROM 
        club_members cm
      JOIN 
        users u ON cm.user_id = u.id
      WHERE 
        cm.club_id = $1
        AND u.deleted_at IS NULL
      ORDER BY 
        cm.joined_at DESC
      LIMIT 20
    `, [clubId]);
    
    // Get upcoming events
    const upcomingEventsResult = await db.query(`
      SELECT 
        id,
        title,
        event_date as date,
        location,
        max_attendees,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = events.id) as current_attendees
      FROM 
        events
      WHERE 
        club_id = $1
        AND event_date >= CURRENT_DATE
        AND deleted_at IS NULL
      ORDER BY 
        event_date ASC
      LIMIT 5
    `, [clubId]);
    
    // Get assignment statistics for this club
    const assignmentStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_assignments,
        COALESCE(AVG(
          CASE 
            WHEN a.max_participants > 0 
            THEN (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) * 100.0 / a.max_participants
            ELSE 0
          END
        ), 0) as average_submission_rate
      FROM 
        assignments a
      WHERE 
        a.club_id = $1
        AND a.deleted_at IS NULL
    `, [clubId]);
    
    // Get event statistics for this club
    const eventStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_events,
        COALESCE(AVG(
          (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)
        ), 0) as average_attendance
      FROM 
        events e
      WHERE 
        e.club_id = $1
        AND e.deleted_at IS NULL
    `, [clubId]);
    
    return {
      success: true,
      data: {
        id: clubData.id,
        name: clubData.name,
        type: clubData.type,
        description: clubData.description,
        coordinator: clubData.coordinator_id ? {
          id: clubData.coordinator_id,
          name: clubData.coordinator_name,
          email: clubData.coordinator_email
        } : null,
        memberCount: parseInt(memberStats.rows[0]?.total_members) || 0,
        members: membersResult.rows,
        upcomingEvents: upcomingEventsResult.rows,
        stats: {
          members: { total_members: parseInt(memberStats.rows[0]?.total_members) || 0 },
          assignments: {
            total_assignments: parseInt(assignmentStatsResult.rows[0]?.total_assignments) || 0,
            average_submission_rate: parseFloat(assignmentStatsResult.rows[0]?.average_submission_rate) || 0
          },
          events: {
            total_events: parseInt(eventStatsResult.rows[0]?.total_events) || 0,
            average_attendance: parseFloat(eventStatsResult.rows[0]?.average_attendance) || 0
          }
        }
      },
      source: 'database'
    };
  } catch (error) {
    console.error(`Error fetching club details for ID ${clubId}:`, error);
    throw new Error('Failed to fetch club details');
  }
}

// Get club statistics with real database data
export async function getClubStats() {
  try {
    // Get club stats with their member counts and engagement
    const clubStatsResult = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.type,
        c.created_at,
        u.name as coordinator_name,
        COUNT(DISTINCT cm.user_id) as member_count,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT a.id) as assignment_count,
        COALESCE(AVG(cs.engagement_score), 0) as engagement_score
      FROM 
        clubs c
      LEFT JOIN 
        users u ON c.coordinator_id = u.id
      LEFT JOIN 
        club_members cm ON c.id = cm.club_id AND cm.status = 'active'
      LEFT JOIN 
        events e ON c.id = e.club_id AND e.deleted_at IS NULL
      LEFT JOIN 
        assignments a ON c.id = a.club_id AND a.deleted_at IS NULL
      LEFT JOIN 
        club_statistics cs ON c.id = cs.club_id
      WHERE 
        c.deleted_at IS NULL
      GROUP BY 
        c.id, c.name, c.type, c.created_at, u.name, cs.engagement_score
      ORDER BY 
        member_count DESC, engagement_score DESC
      LIMIT 20
    `);
    
    return {
      success: true,
      data: clubStatsResult.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching club statistics:', error);
    throw new Error('Failed to fetch club statistics');
  }
}

// Get assignment statistics with real database data
export async function getAssignmentStats() {
  try {
    // Get assignment stats with their submission rates
    const assignmentStatsResult = await db.query(`
      SELECT 
        a.id, 
        a.title, 
        c.name as club_name,
        a.due_date,
        a.created_at,
        a.max_participants as total_slots,
        COUNT(DISTINCT asub.id) as submitted_count,
        CASE 
          WHEN a.max_participants > 0 
          THEN ROUND(COUNT(DISTINCT asub.id) * 100.0 / a.max_participants, 2)
          ELSE 0
        END as submission_rate,
        COALESCE(AVG(CAST(asub.score AS NUMERIC)), 0) as average_score,
        a.status
      FROM 
        assignments a
      JOIN 
        clubs c ON a.club_id = c.id
      LEFT JOIN 
        assignment_submissions asub ON a.id = asub.assignment_id
      WHERE 
        a.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND a.due_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY 
        a.id, a.title, c.name, a.due_date, a.created_at, a.max_participants, a.status
      ORDER BY 
        a.due_date DESC
      LIMIT 25
    `);
    
    return {
      success: true,
      data: assignmentStatsResult.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw new Error('Failed to fetch assignment statistics');
  }
}

// Get event statistics with real database data
export async function getEventStats() {
  try {
    // Get event stats with their attendee counts
    const eventStatsResult = await db.query(`
      SELECT 
        e.id, 
        e.title, 
        c.name as club_name,
        e.event_date,
        e.location,
        e.max_attendees,
        COUNT(DISTINCT ea.id) as attendee_count,
        CASE 
          WHEN e.max_attendees > 0 
          THEN ROUND(COUNT(DISTINCT ea.id) * 100.0 / e.max_attendees, 2)
          ELSE 0
        END as attendance_rate,
        CASE 
          WHEN e.event_date < CURRENT_DATE THEN 'completed'
          WHEN e.event_date = CURRENT_DATE THEN 'ongoing'
          ELSE 'upcoming'
        END as status,
        e.created_at
      FROM 
        events e
      JOIN 
        clubs c ON e.club_id = c.id
      LEFT JOIN 
        event_attendees ea ON e.id = ea.event_id
      WHERE 
        e.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND e.event_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '90 days'
      GROUP BY 
        e.id, e.title, c.name, e.event_date, e.location, e.max_attendees, e.created_at
      ORDER BY 
        e.event_date DESC
      LIMIT 25
    `);
    
    return {
      success: true,
      data: eventStatsResult.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    throw new Error('Failed to fetch event statistics');
  }
}

// Get user profile data with real database data
export async function getUserProfile(userId: string) {
  try {
    // Get user data with complete profile information
    const userResult = await db.query(`
      SELECT 
        id, name, email, username, role, avatar, bio, 
        created_at, updated_at, last_login_at, email_verified,
        phone, location, website, github, linkedin, twitter
      FROM 
        users 
      WHERE 
        id = $1 AND deleted_at IS NULL
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userData = userResult.rows[0];
    
    // Get club memberships
    const clubMembershipsResult = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        cm.joined_at,
        cm.status,
        cm.role as membership_role
      FROM 
        club_members cm
      JOIN 
        clubs c ON cm.club_id = c.id
      WHERE 
        cm.user_id = $1
        AND c.deleted_at IS NULL
      ORDER BY 
        cm.joined_at DESC
    `, [userId]);
    
    // Get assignment statistics
    const assignmentStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COALESCE(AVG(CAST(score AS NUMERIC)), 0) as average_score,
        COUNT(CASE WHEN score >= 80 THEN 1 END) as high_scores,
        MAX(submitted_at) as last_submission
      FROM 
        assignment_submissions
      WHERE 
        user_id = $1
    `, [userId]);
    
    // Get event attendance statistics
    const eventStatsResult = await db.query(`
      SELECT 
        COUNT(*) as total_attendances,
        COUNT(DISTINCT e.club_id) as clubs_participated,
        MAX(ea.joined_at) as last_event_attendance
      FROM 
        event_attendees ea
      JOIN 
        events e ON ea.event_id = e.id
      WHERE 
        ea.user_id = $1
        AND e.deleted_at IS NULL
    `, [userId]);
    
    // Get recent activities
    const recentActivitiesResult = await db.query(`
      (
        SELECT 
          'assignment' as type,
          'Submitted: ' || a.title as description,
          asub.submitted_at as timestamp,
          asub.id as activity_id
        FROM 
          assignment_submissions asub
        JOIN 
          assignments a ON asub.assignment_id = a.id
        WHERE 
          asub.user_id = $1
          AND a.deleted_at IS NULL
      )
      UNION ALL
      (
        SELECT 
          'event' as type,
          'Attended: ' || e.title as description,
          ea.joined_at as timestamp,
          ea.id as activity_id
        FROM 
          event_attendees ea
        JOIN 
          events e ON ea.event_id = e.id
        WHERE 
          ea.user_id = $1
          AND e.deleted_at IS NULL
      )
      ORDER BY 
        timestamp DESC
      LIMIT 10
    `, [userId]);
    
    // Format the response
    const userWithStats = {
      ...userData,
      clubMembers: clubMembershipsResult.rows.map(club => ({
        club: {
          id: club.id,
          name: club.name,
          type: club.type
        },
        joined_at: club.joined_at,
        status: club.status,
        role: club.membership_role
      })),
      statistics: {
        assignments: {
          total: parseInt(assignmentStatsResult.rows[0]?.total_submissions) || 0,
          submissions: parseInt(assignmentStatsResult.rows[0]?.total_submissions) || 0,
          averageScore: parseFloat(assignmentStatsResult.rows[0]?.average_score) || 0,
          highScores: parseInt(assignmentStatsResult.rows[0]?.high_scores) || 0
        },
        events: {
          total: parseInt(eventStatsResult.rows[0]?.total_attendances) || 0,
          attended: parseInt(eventStatsResult.rows[0]?.total_attendances) || 0,
          attendanceRate: parseInt(eventStatsResult.rows[0]?.total_attendances) || 0,
          clubsParticipated: parseInt(eventStatsResult.rows[0]?.clubs_participated) || 0
        }
      },
      recentActivities: recentActivitiesResult.rows
    };
    
    return {
      success: true,
      data: userWithStats,
      source: 'database'
    };
  } catch (error) {
    console.error(`Error fetching user profile for ID ${userId}:`, error);
    throw new Error('Failed to fetch user profile');
  }
}

// Generate comprehensive report data for a user or club
export async function generateReportData(type: ReportType, id: string) {
  try {
    if (type === 'user') {
      // Generate comprehensive user report
      const userData = await getUserProfile(id);
      
      // Get detailed assignment history
      const assignmentDetailsResult = await db.query(`
        SELECT 
          a.title,
          a.due_date,
          asub.submitted_at,
          asub.score,
          asub.feedback,
          c.name as club_name,
          a.max_score,
          CASE 
            WHEN asub.submitted_at <= a.due_date THEN 'on_time'
            ELSE 'late'
          END as submission_status
        FROM 
          assignment_submissions asub
        JOIN 
          assignments a ON asub.assignment_id = a.id
        JOIN 
          clubs c ON a.club_id = c.id
        WHERE 
          asub.user_id = $1
          AND a.deleted_at IS NULL
          AND c.deleted_at IS NULL
        ORDER BY 
          asub.submitted_at DESC
        LIMIT 50
      `, [id]);
      
      // Get detailed event attendance history
      const eventDetailsResult = await db.query(`
        SELECT 
          e.title,
          e.event_date,
          e.location,
          c.name as club_name,
          ea.joined_at as attendance_time,
          CASE 
            WHEN ea.joined_at <= e.event_date THEN 'attended'
            ELSE 'registered'
          END as attendance_status
        FROM 
          event_attendees ea
        JOIN 
          events e ON ea.event_id = e.id
        JOIN 
          clubs c ON e.club_id = c.id
        WHERE 
          ea.user_id = $1
          AND e.deleted_at IS NULL
          AND c.deleted_at IS NULL
        ORDER BY 
          e.event_date DESC
        LIMIT 50
      `, [id]);
      
      return {
        success: true,
        data: {
          user: userData.data,
          details: {
            assignments: assignmentDetailsResult.rows,
            events: eventDetailsResult.rows
          }
        },
        source: 'database'
      };
      
    } else if (type === 'club') {
      // Generate comprehensive club report
      const clubData = await getClubDetails(id);
      
      // Get detailed member analytics
      const memberAnalyticsResult = await db.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          cm.joined_at,
          cm.status,
          COUNT(DISTINCT asub.id) as assignments_submitted,
          COUNT(DISTINCT ea.id) as events_attended,
          COALESCE(AVG(CAST(asub.score AS NUMERIC)), 0) as average_score
        FROM 
          club_members cm
        JOIN 
          users u ON cm.user_id = u.id
        LEFT JOIN 
          assignment_submissions asub ON u.id = asub.user_id
        LEFT JOIN 
          assignments a ON asub.assignment_id = a.id AND a.club_id = $1
        LEFT JOIN 
          event_attendees ea ON u.id = ea.user_id
        LEFT JOIN 
          events e ON ea.event_id = e.id AND e.club_id = $1
        WHERE 
          cm.club_id = $1
          AND u.deleted_at IS NULL
        GROUP BY 
          u.id, u.name, u.email, u.role, cm.joined_at, cm.status
        ORDER BY 
          cm.joined_at DESC
      `, [id]);
      
      // Get performance metrics
      const performanceMetricsResult = await db.query(`
        SELECT 
          DATE_TRUNC('month', a.created_at) as month,
          COUNT(DISTINCT a.id) as assignments_created,
          COUNT(DISTINCT asub.id) as total_submissions,
          COALESCE(AVG(CAST(asub.score AS NUMERIC)), 0) as average_score
        FROM 
          assignments a
        LEFT JOIN 
          assignment_submissions asub ON a.id = asub.assignment_id
        WHERE 
          a.club_id = $1
          AND a.deleted_at IS NULL
          AND a.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY 
          DATE_TRUNC('month', a.created_at)
        ORDER BY 
          month DESC
      `, [id]);
      
      return {
        success: true,
        data: {
          club: clubData.data,
          analytics: {
            members: memberAnalyticsResult.rows,
            performance: performanceMetricsResult.rows
          }
        },
        source: 'database'
      };
    }
    
    throw new Error(`Invalid report type: ${type}`);
  } catch (error) {
    console.error(`Error generating ${type} report for ID ${id}:`, error);
    throw new Error(`Failed to generate ${type} report`);
  }
}

// Get dashboard overview statistics
export async function getDashboardOverview() {
  try {
    // Get overall system statistics
    const overviewResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
        (SELECT COUNT(*) FROM clubs WHERE deleted_at IS NULL) as total_clubs,
        (SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL) as total_assignments,
        (SELECT COUNT(*) FROM events WHERE deleted_at IS NULL) as total_events,
        (SELECT COUNT(*) FROM assignment_submissions) as total_submissions,
        (SELECT COUNT(*) FROM event_attendees) as total_attendances,
        (SELECT COUNT(*) FROM users WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL) as active_users_week,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL) as new_users_month
    `);
    
    // Get growth metrics
    const growthMetricsResult = await db.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users
      FROM 
        users
      WHERE 
        created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND deleted_at IS NULL
      GROUP BY 
        DATE_TRUNC('day', created_at)
      ORDER BY 
        date DESC
    `);
    
    return {
      success: true,
      data: {
        overview: overviewResult.rows[0],
        growth: growthMetricsResult.rows
      },
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw new Error('Failed to fetch dashboard overview');
  }
}

