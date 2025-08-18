import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/AuthMiddleware';
import { db } from '@/lib/database-service';

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
    const clubsCount = await db.clubs.count();

    // Get upcoming events count
    const eventsCount = await db.events.count({
      where: {
        event_date: {
          gte: new Date()
        }
      }
    });

    // Get total members count
    const membersCount = await db.users.count();

    // Get user's joined clubs count
    const userClubsCount = await db.club_members.count({
      where: {
        user_id: userId
      }
    });

    // Get user's assignments stats
    const assignments = await db.assignments.findMany({
      where: {
        status: 'active'
      }
    });

    const assignmentSubmissions = await db.assignment_submissions.count({
      where: {
        user_id: userId,
        status: 'submitted'
      }
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignmentSubmissions;

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
