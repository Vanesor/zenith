import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }
    
    // Check if user has admin access
    const adminRoles = ['coordinator', 'co_coordinator', 'president', 'vice_president', 'innovation_head', 'treasurer', 'outreach', 'zenith_committee'];
    if (!adminRoles.includes(authResult.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { type, timeRange, clubId } = await request.json();

    // Date filter based on time range
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

    let reportData: any = {};

    if (type === 'club' && clubId) {
      // Generate club-specific report with comprehensive data
      const clubStatsQuery = `
        SELECT 
          c.id,
          c.name,
          c.type,
          c.description,
          c.created_at,
          c.member_count,
          COUNT(DISTINCT cm.user_id) as actual_member_count,
          COUNT(DISTINCT a.id) as assignment_count,
          COUNT(DISTINCT e.id) as event_count,
          COUNT(DISTINCT p.id) as post_count,
          COUNT(DISTINCT asub.id) as submission_count,
          COALESCE(AVG(asub.total_score), 0) as average_score,
          COUNT(DISTINCT CASE WHEN ea.attendance_status = 'attended' THEN ea.id END) as total_attendees,
          COUNT(DISTINCT ea.id) as total_registrations,
          COUNT(DISTINCT l.id) as total_likes,
          COUNT(DISTINCT comm.id) as total_comments
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id
        LEFT JOIN assignments a ON c.id = a.club_id
        LEFT JOIN events e ON c.id = e.club_id
        LEFT JOIN posts p ON c.id = p.club_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
        LEFT JOIN event_attendees ea ON e.id = ea.event_id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments comm ON p.id = comm.post_id
        WHERE c.id = $1
        GROUP BY c.id, c.name, c.type, c.description, c.created_at, c.member_count
      `;

      const clubStats = await db.query(clubStatsQuery, [clubId]);

      // Get recent activities
      const recentActivitiesQuery = `
        SELECT 
          'post' as type,
          p.title as title,
          p.created_at,
          u.name as author
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.club_id = $1 ${dateFilter.replace('created_at', 'p.created_at')}
        UNION ALL
        SELECT 
          'event' as type,
          e.title as title,
          e.created_at,
          u.name as author
        FROM events e
        JOIN users u ON e.created_by = u.id
        WHERE e.club_id = $1 ${dateFilter.replace('created_at', 'e.created_at')}
        UNION ALL
        SELECT 
          'assignment' as type,
          a.title as title,
          a.created_at,
          u.name as author
        FROM assignments a
        JOIN users u ON a.created_by = u.id
        WHERE a.club_id = $1 ${dateFilter.replace('created_at', 'a.created_at')}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const recentActivities = await db.query(recentActivitiesQuery, [clubId]);

      // Get top performers
      const topPerformersQuery = `
        SELECT 
          u.name,
          u.email,
          COUNT(DISTINCT asub.id) as submissions,
          COALESCE(AVG(asub.total_score), 0) as avg_score,
          COUNT(DISTINCT p.id) as posts_created,
          COUNT(DISTINCT comm.id) as comments_made
        FROM users u
        LEFT JOIN assignment_submissions asub ON u.id = asub.user_id
        LEFT JOIN assignments a ON asub.assignment_id = a.id AND a.club_id = $1
        LEFT JOIN posts p ON u.id = p.author_id AND p.club_id = $1
        LEFT JOIN comments comm ON u.id = comm.author_id
        LEFT JOIN posts p2 ON comm.post_id = p2.id AND p2.club_id = $1
        WHERE u.club_id = $1
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(DISTINCT asub.id) > 0 OR COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT comm.id) > 0
        ORDER BY (COUNT(DISTINCT asub.id) + COUNT(DISTINCT p.id) + COUNT(DISTINCT comm.id)) DESC
        LIMIT 5
      `;

      const topPerformers = await db.query(topPerformersQuery, [clubId]);

      reportData = {
        type: 'Club Report',
        club: clubStats.rows[0] || {},
        recentActivities: recentActivities.rows || [],
        topPerformers: topPerformers.rows || [],
        generatedAt: new Date().toISOString(),
        timeRange,
        period: `Last ${timeRange === 'week' ? '7 days' : timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '90 days' : '365 days'}`
      };
    } else {
      // Generate overall system report
      const overallStatsQuery = `
        SELECT 
          COUNT(DISTINCT c.id) as total_clubs,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT p.id) as total_posts,
          COUNT(DISTINCT asub.id) as total_submissions,
          COALESCE(AVG(asub.total_score), 0) as overall_average_score,
          COUNT(DISTINCT ea.id) as total_event_registrations,
          COUNT(DISTINCT CASE WHEN ea.attendance_status = 'attended' THEN ea.id END) as total_event_attendances,
          COUNT(DISTINCT l.id) as total_likes,
          COUNT(DISTINCT comm.id) as total_comments
        FROM clubs c
        LEFT JOIN users u ON c.id = u.club_id
        LEFT JOIN assignments a ON c.id = a.club_id
        LEFT JOIN events e ON c.id = e.club_id
        LEFT JOIN posts p ON c.id = p.club_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
        LEFT JOIN event_attendees ea ON e.id = ea.event_id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments comm ON p.id = comm.post_id
        WHERE 1=1 ${dateFilter.replace('created_at', 'c.created_at')}
      `;

      const overallStats = await db.query(overallStatsQuery);

      // Get club performance comparison
      const clubComparisonQuery = `
        SELECT 
          c.name,
          c.type,
          COUNT(DISTINCT cm.user_id) as members,
          COUNT(DISTINCT a.id) as assignments,
          COUNT(DISTINCT e.id) as events,
          COUNT(DISTINCT p.id) as posts,
          COALESCE(AVG(asub.total_score), 0) as avg_score
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id
        LEFT JOIN assignments a ON c.id = a.club_id
        LEFT JOIN events e ON c.id = e.club_id
        LEFT JOIN posts p ON c.id = p.club_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
        GROUP BY c.id, c.name, c.type
        ORDER BY members DESC, avg_score DESC
        LIMIT 10
      `;

      const clubComparison = await db.query(clubComparisonQuery);

      // Get system-wide trends
      const trendsQuery = `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as activity_count,
          'user_registration' as activity_type
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        UNION ALL
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as activity_count,
          'post_creation' as activity_type
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
        LIMIT 20
      `;

      const trends = await db.query(trendsQuery);

      reportData = {
        type: 'Overall System Report',
        stats: overallStats.rows[0] || {},
        clubComparison: clubComparison.rows || [],
        trends: trends.rows || [],
        generatedAt: new Date().toISOString(),
        timeRange,
        period: `Last ${timeRange === 'week' ? '7 days' : timeRange === 'month' ? '30 days' : timeRange === 'quarter' ? '90 days' : '365 days'}`
      };
    }

    // Calculate engagement metrics
    const engagementScore = calculateEngagementScore(reportData);
    reportData.engagementScore = engagementScore;

    // Generate insights and recommendations
    const insights = generateInsights(reportData);
    const recommendations = generateRecommendations(reportData);

    const reportContent = {
      title: reportData.type,
      generatedAt: reportData.generatedAt,
      period: reportData.period,
      executiveSummary: generateExecutiveSummary(reportData),
      data: reportData,
      insights: insights,
      recommendations: recommendations,
      engagementScore: engagementScore
    };

    return NextResponse.json({
      success: true,
      report: reportContent,
      message: "Comprehensive analytics report generated successfully"
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Helper functions for report generation
function calculateEngagementScore(reportData: any): number {
  if (reportData.type === 'Club Report') {
    const club = reportData.club;
    const members = club.actual_member_count || 1;
    const posts = club.post_count || 0;
    const comments = club.total_comments || 0;
    const likes = club.total_likes || 0;
    const submissions = club.submission_count || 0;
    
    return Math.min(100, Math.round(((posts + comments + likes + submissions) / members) * 5));
  } else {
    const stats = reportData.stats;
    const users = stats.total_users || 1;
    const posts = stats.total_posts || 0;
    const comments = stats.total_comments || 0;
    const likes = stats.total_likes || 0;
    const submissions = stats.total_submissions || 0;
    
    return Math.min(100, Math.round(((posts + comments + likes + submissions) / users) * 3));
  }
}

function generateExecutiveSummary(reportData: any): string {
  if (reportData.type === 'Club Report') {
    const club = reportData.club;
    return `${club.name} has ${club.actual_member_count} active members and has generated ${club.post_count} posts with an average assignment score of ${Math.round(club.average_score)}%. The club shows ${reportData.engagementScore > 70 ? 'high' : reportData.engagementScore > 40 ? 'moderate' : 'low'} engagement levels.`;
  } else {
    const stats = reportData.stats;
    return `The system currently has ${stats.total_clubs} active clubs with ${stats.total_users} total users. Overall performance shows ${stats.total_submissions} assignment submissions with an average score of ${Math.round(stats.overall_average_score)}%.`;
  }
}

function generateInsights(reportData: any): string[] {
  const insights = [];
  
  if (reportData.type === 'Club Report') {
    const club = reportData.club;
    
    if (club.average_score > 80) {
      insights.push("Excellent academic performance with high assignment scores");
    }
    
    if (club.post_count > club.actual_member_count) {
      insights.push("High content creation activity indicating strong member engagement");
    }
    
    if (reportData.topPerformers.length > 0) {
      insights.push(`Top performer: ${reportData.topPerformers[0].name} with ${reportData.topPerformers[0].submissions} submissions`);
    }
    
    if (club.event_count > 0) {
      const attendanceRate = ((club.total_attendees / club.total_registrations) * 100) || 0;
      insights.push(`Event attendance rate: ${Math.round(attendanceRate)}%`);
    }
  } else {
    const stats = reportData.stats;
    
    if (stats.total_users > 0) {
      insights.push(`Average users per club: ${Math.round(stats.total_users / stats.total_clubs)}`);
    }
    
    if (reportData.clubComparison.length > 0) {
      const topClub = reportData.clubComparison[0];
      insights.push(`Most active club: ${topClub.name} with ${topClub.members} members`);
    }
    
    if (stats.total_event_attendances > 0) {
      const eventAttendanceRate = ((stats.total_event_attendances / stats.total_event_registrations) * 100) || 0;
      insights.push(`System-wide event attendance rate: ${Math.round(eventAttendanceRate)}%`);
    }
  }
  
  return insights;
}

function generateRecommendations(reportData: any): string[] {
  const recommendations = [];
  
  if (reportData.engagementScore < 40) {
    recommendations.push("Implement gamification features to boost member engagement");
    recommendations.push("Create more interactive content and discussion forums");
  }
  
  if (reportData.type === 'Club Report') {
    const club = reportData.club;
    
    if (club.average_score < 70) {
      recommendations.push("Provide additional academic support and tutoring sessions");
    }
    
    if (club.post_count < club.actual_member_count * 0.5) {
      recommendations.push("Encourage more content creation through competitions and incentives");
    }
    
    if (club.event_count < 2) {
      recommendations.push("Organize more events to increase member participation");
    }
  } else {
    recommendations.push("Share best practices from top-performing clubs across the system");
    recommendations.push("Implement cross-club collaboration initiatives");
    recommendations.push("Develop mentorship programs between high and low-performing clubs");
  }
  
  return recommendations;
}
