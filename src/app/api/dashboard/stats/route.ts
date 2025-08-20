import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }
    
    // Get total clubs count
    const clubsResult = await db.query(`SELECT COUNT(*) as count FROM clubs`);
    const clubsCount = parseInt(clubsResult.rows[0]?.count) || 0;

    // Get upcoming events count
    const eventsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM events 
      WHERE event_date >= CURRENT_DATE
    `);
    const eventsCount = parseInt(eventsResult.rows[0]?.count) || 0;

    // Get total members count
    const membersResult = await db.query(`SELECT COUNT(*) as count FROM users`);
    const membersCount = parseInt(membersResult.rows[0]?.count) || 0;

    // Get user's joined clubs count
    const userClubsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM club_members 
      WHERE user_id = $1 AND status = 'active'
    `, [userId]);
    const userClubsCount = parseInt(userClubsResult.rows[0]?.count) || 0;

    // Get user's assignments stats
    const assignmentsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM assignments 
      WHERE status = 'active'
    `);
    const totalAssignments = parseInt(assignmentsResult.rows[0]?.count) || 0;

    const submissionsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM assignment_submissions 
      WHERE user_id = $1
    `, [userId]);
    const completedAssignments = parseInt(submissionsResult.rows[0]?.count) || 0;

    // Calculate activity score (0-100)
    let activityScore = 0;
    if (totalAssignments > 0) {
      activityScore += (completedAssignments / totalAssignments) * 40; // 40% weight for assignments
    }
    activityScore += Math.min(userClubsCount * 20, 30); // 30% weight for club participation (max 30)
    
    // Add some base activity for being logged in
    activityScore += 30; // Base activity

    return NextResponse.json({
      stats: {
        total_clubs: clubsCount,
        upcoming_events: eventsCount,
        total_members: membersCount,
        user_clubs: userClubsCount,
        activity_score: Math.round(activityScore),
        assignment_completion: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
