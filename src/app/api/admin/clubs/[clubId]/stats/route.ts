import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user has admin access
    const adminRoles = ['president', 'vice_president', 'innovation_head', 'treasurer', 'outreach', 'zenith_committee'];
    if (!adminRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { clubId } = params;

    // Get club basic info
    const clubResult = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.type,
        c.created_at,
        c.status,
        u.name as coordinator_name,
        u.email as coordinator_email
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      WHERE c.id = $1
    `, [clubId]);

    if (clubResult.rows.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const club = clubResult.rows[0];

    // Get member statistics
    const memberStats = await db.query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_members,
        COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_members,
        string_agg(DISTINCT u.role, ', ') as roles
      FROM users u
      WHERE u.club_id = $1 AND u.deleted_at IS NULL
    `, [clubId]);

    // Get assignment statistics
    const assignmentStats = await db.query(`
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as active_assignments,
        COUNT(CASE WHEN a.due_date < NOW() THEN 1 END) as overdue_assignments,
        AVG(CASE WHEN s.score IS NOT NULL THEN s.score ELSE NULL END) as average_score
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.club_id = $1 AND a.deleted_at IS NULL
    `, [clubId]);

    // Get event statistics
    const eventStats = await db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN e.event_date >= NOW() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN e.event_date < NOW() THEN 1 END) as completed_events,
        AVG(e.attendees_count) as average_attendance
      FROM events e
      WHERE e.club_id = $1 AND e.deleted_at IS NULL
    `, [clubId]);

    // Get recent assignments
    const recentAssignments = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.due_date,
        a.status,
        COUNT(s.id) as submission_count,
        COUNT(CASE WHEN s.submitted_at <= a.due_date THEN 1 END) as on_time_submissions
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.club_id = $1 AND a.deleted_at IS NULL
      GROUP BY a.id, a.title, a.due_date, a.status
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [clubId]);

    // Get recent events
    const recentEvents = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.location,
        e.attendees_count,
        e.max_attendees
      FROM events e
      WHERE e.club_id = $1 AND e.deleted_at IS NULL
      ORDER BY e.event_date DESC
      LIMIT 10
    `, [clubId]);

    // Get top members
    const topMembers = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT ea.id) as event_attendance,
        AVG(s.score) as average_score
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN event_attendees ea ON u.id = ea.user_id
      WHERE u.club_id = $1 AND u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.email, u.role, u.avatar
      ORDER BY (COUNT(DISTINCT s.id) + COUNT(DISTINCT ea.id)) DESC
      LIMIT 10
    `, [clubId]);

    const stats = {
      club,
      memberStats: {
        total: parseInt(memberStats.rows[0]?.total_members) || 0,
        active: parseInt(memberStats.rows[0]?.active_members) || 0,
        newThisMonth: parseInt(memberStats.rows[0]?.new_members) || 0,
        roles: memberStats.rows[0]?.roles || ''
      },
      assignmentStats: {
        total: parseInt(assignmentStats.rows[0]?.total_assignments) || 0,
        active: parseInt(assignmentStats.rows[0]?.active_assignments) || 0,
        overdue: parseInt(assignmentStats.rows[0]?.overdue_assignments) || 0,
        averageScore: parseFloat(assignmentStats.rows[0]?.average_score) || 0
      },
      eventStats: {
        total: parseInt(eventStats.rows[0]?.total_events) || 0,
        upcoming: parseInt(eventStats.rows[0]?.upcoming_events) || 0,
        completed: parseInt(eventStats.rows[0]?.completed_events) || 0,
        averageAttendance: parseFloat(eventStats.rows[0]?.average_attendance) || 0
      },
      recentAssignments: recentAssignments.rows,
      recentEvents: recentEvents.rows,
      topMembers: topMembers.rows
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching club stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club statistics' },
      { status: 500 }
    );
  }
}
