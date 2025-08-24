import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    
    // Check if user has analytics access
    const hasAccess = [
      'coordinator', 'co_coordinator', 'president', 'vice_president',
      'innovation_head', 'treasurer', 'outreach', 'zenith_committee'
    ].includes(user.role);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const timeRange = searchParams.get('timeRange') || 'month';

    // Date filters based on time range
    let dateFilter = '';
    switch (timeRange) {
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= NOW() - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    // Club filter
    let clubFilter = '';
    if (clubId && user.role !== 'zenith_committee') {
      // Non-zenith committee members can only see their own club
      clubFilter = user.club_id ? `AND club_id = '${user.club_id}'` : '';
    } else if (clubId) {
      clubFilter = `AND club_id = '${clubId}'`;
    }

    // Fetch club statistics
    const clubStatsQuery = `
      SELECT 
        COUNT(DISTINCT cm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN u.last_activity >= NOW() - INTERVAL '7 days' THEN cm.user_id END) as active_members,
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.event_date >= NOW() THEN e.id END) as upcoming_events,
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.id END) as completed_assignments,
        COALESCE(AVG(CASE WHEN ea.attendance_status = 'attended' THEN 1.0 ELSE 0.0 END) * 100, 0) as average_attendance,
        COUNT(DISTINCT CASE WHEN cm.joined_at >= NOW() - INTERVAL '30 days' THEN cm.user_id END) as member_growth
      FROM clubs c
      LEFT JOIN club_members cm ON c.id = cm.club_id
      LEFT JOIN users u ON cm.user_id = u.id
      LEFT JOIN events e ON c.id = e.club_id
      LEFT JOIN assignments a ON c.id = a.club_id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
      LEFT JOIN event_attendees ea ON e.id = ea.event_id
      WHERE 1=1 ${clubFilter.replace('club_id', 'c.id')}
    `;

    const clubStats = await db.query(clubStatsQuery);

    // Fetch assignment statistics
    const assignmentStatsQuery = `
      SELECT 
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.id END) as submitted_assignments,
        COUNT(DISTINCT CASE WHEN asub.status = 'in_progress' THEN asub.id END) as pending_assignments,
        COUNT(DISTINCT CASE WHEN a.due_date < NOW() AND (asub.status IS NULL OR asub.status != 'submitted') THEN a.id END) as overdue_assignments,
        COALESCE(AVG(asub.total_score), 0) as average_score,
        CASE WHEN COUNT(DISTINCT a.id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.id END)::float / COUNT(DISTINCT a.id) * 100)
          ELSE 0 
        END as submission_rate
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
      WHERE 1=1 ${clubFilter.replace('club_id', 'a.club_id')} ${dateFilter.replace('created_at', 'a.created_at')}
    `;

    const assignmentStats = await db.query(assignmentStatsQuery);

    // Fetch event statistics
    const eventStatsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.event_date >= NOW() THEN e.id END) as upcoming_events,
        COUNT(DISTINCT CASE WHEN e.event_date < NOW() THEN e.id END) as completed_events,
        COALESCE(AVG(CASE WHEN ea.attendance_status = 'attended' THEN 1.0 ELSE 0.0 END) * 100, 0) as average_attendance
      FROM events e
      LEFT JOIN event_attendees ea ON e.id = ea.event_id
      WHERE 1=1 ${clubFilter.replace('club_id', 'e.club_id')} ${dateFilter.replace('created_at', 'e.created_at')}
    `;

    const eventStats = await db.query(eventStatsQuery);

    // Fetch popular event types
    const eventTypesQuery = `
      SELECT 
        e.type,
        COUNT(*) as count
      FROM events e
      WHERE 1=1 ${clubFilter.replace('club_id', 'e.club_id')} ${dateFilter.replace('created_at', 'e.created_at')}
      GROUP BY e.type
      ORDER BY count DESC
      LIMIT 5
    `;

    const popularEventTypes = await db.query(eventTypesQuery);

    // Fetch member statistics
    const memberStatsQuery = `
      SELECT 
        COUNT(DISTINCT cm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN cm.joined_at >= NOW() - INTERVAL '30 days' THEN cm.user_id END) as new_this_month,
        COUNT(DISTINCT CASE WHEN u.last_activity >= NOW() - INTERVAL '7 days' THEN cm.user_id END) as active_this_week,
        CASE WHEN COUNT(DISTINCT cm.user_id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN u.last_activity >= NOW() - INTERVAL '30 days' THEN cm.user_id END)::float / COUNT(DISTINCT cm.user_id) * 100)
          ELSE 0 
        END as retention_rate
      FROM club_members cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE 1=1 ${clubFilter.replace('club_id', 'cm.club_id')}
    `;

    const memberStats = await db.query(memberStatsQuery);

    // Fetch top contributors (based on posts and comments)
    const topContributorsQuery = `
      SELECT 
        u.name,
        (COUNT(DISTINCT p.id) + COUNT(DISTINCT c.id)) as contributions
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id ${dateFilter.replace('created_at', 'p.created_at')}
      LEFT JOIN comments c ON u.id = c.author_id ${dateFilter.replace('created_at', 'c.created_at')}
      WHERE 1=1 ${clubFilter.replace('club_id', 'u.club_id')}
      GROUP BY u.id, u.name
      HAVING (COUNT(DISTINCT p.id) + COUNT(DISTINCT c.id)) > 0
      ORDER BY contributions DESC
      LIMIT 5
    `;

    const topContributors = await db.query(topContributorsQuery);

    // Fetch engagement metrics
    const engagementQuery = `
      SELECT 
        COUNT(DISTINCT p.id) as posts_this_period,
        COUNT(DISTINCT c.id) as comments_this_period,
        COUNT(DISTINCT l.id) as likes_this_period
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id ${dateFilter.replace('created_at', 'c.created_at')}
      LEFT JOIN likes l ON p.id = l.post_id ${dateFilter.replace('created_at', 'l.created_at')}
      WHERE 1=1 ${clubFilter.replace('club_id', 'p.club_id')} ${dateFilter.replace('created_at', 'p.created_at')}
    `;

    const engagementMetrics = await db.query(engagementQuery);

    // Calculate overall engagement score
    const totalUsers = memberStats.rows[0]?.total_members || 1;
    const totalPosts = engagementMetrics.rows[0]?.posts_this_period || 0;
    const totalComments = engagementMetrics.rows[0]?.comments_this_period || 0;
    const totalLikes = engagementMetrics.rows[0]?.likes_this_period || 0;
    const overallEngagement = Math.min(100, ((totalPosts + totalComments + totalLikes) / totalUsers) * 10);

    const analyticsData = {
      clubStats: {
        totalMembers: parseInt(clubStats.rows[0]?.total_members || '0'),
        activeMembers: parseInt(clubStats.rows[0]?.active_members || '0'),
        totalEvents: parseInt(clubStats.rows[0]?.total_events || '0'),
        upcomingEvents: parseInt(clubStats.rows[0]?.upcoming_events || '0'),
        totalAssignments: parseInt(clubStats.rows[0]?.total_assignments || '0'),
        completedAssignments: parseInt(clubStats.rows[0]?.completed_assignments || '0'),
        averageAttendance: parseFloat(clubStats.rows[0]?.average_attendance || '0'),
        memberGrowth: parseInt(clubStats.rows[0]?.member_growth || '0'),
      },
      assignmentStats: {
        total: parseInt(assignmentStats.rows[0]?.total_assignments || '0'),
        submitted: parseInt(assignmentStats.rows[0]?.submitted_assignments || '0'),
        pending: parseInt(assignmentStats.rows[0]?.pending_assignments || '0'),
        overdue: parseInt(assignmentStats.rows[0]?.overdue_assignments || '0'),
        averageScore: parseFloat(assignmentStats.rows[0]?.average_score || '0'),
        submissionRate: parseFloat(assignmentStats.rows[0]?.submission_rate || '0'),
      },
      eventStats: {
        total: parseInt(eventStats.rows[0]?.total_events || '0'),
        upcoming: parseInt(eventStats.rows[0]?.upcoming_events || '0'),
        completed: parseInt(eventStats.rows[0]?.completed_events || '0'),
        averageAttendance: parseFloat(eventStats.rows[0]?.average_attendance || '0'),
        popularEventTypes: popularEventTypes.rows.map(row => ({
          type: row.type || 'Unknown',
          count: parseInt(row.count || '0')
        })),
      },
      memberStats: {
        total: parseInt(memberStats.rows[0]?.total_members || '0'),
        newThisMonth: parseInt(memberStats.rows[0]?.new_this_month || '0'),
        activeThisWeek: parseInt(memberStats.rows[0]?.active_this_week || '0'),
        retentionRate: parseFloat(memberStats.rows[0]?.retention_rate || '0'),
        topContributors: topContributors.rows.map(row => ({
          name: row.name || 'Unknown',
          contributions: parseInt(row.contributions || '0')
        })),
      },
      engagementMetrics: {
        postsThisMonth: parseInt(engagementMetrics.rows[0]?.posts_this_period || '0'),
        commentsThisMonth: parseInt(engagementMetrics.rows[0]?.comments_this_period || '0'),
        likesThisMonth: parseInt(engagementMetrics.rows[0]?.likes_this_period || '0'),
        overallEngagement: Math.round(overallEngagement),
      },
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
      clubId: clubId || 'all'
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
