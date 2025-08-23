import { NextRequest, NextResponse } from "next/server";
import { db, queryRawSQL } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

// GET /api/management/stats
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error || "Authentication required",
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    const userId = authResult.user?.id || '';

    // Check if user is a manager (has management role)
    const userResult = await queryRawSQL(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = userResult.rows[0].role;
    const isManager = [
      "COORDINATOR",
      "CO_COORDINATOR",
      "SECRETARY",
      "MEDIA",
      "PRESIDENT",
      "VICE_PRESIDENT",
      "INNOVATION_HEAD",
      "TREASURER",
      "OUTREACH",
    ].includes(userRole);

    if (!isManager) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get total members count
    const totalMembersResult = await queryRawSQL(
      "SELECT COUNT(*) as count FROM users WHERE club_id IS NOT NULL"
    );

    // Get active events count (events happening in the future)
    const activeEventsResult = await queryRawSQL(
      "SELECT COUNT(*) as count FROM events WHERE event_date >= CURRENT_DATE"
    );

    // Get total assignments count
    const totalAssignmentsResult = await queryRawSQL(
      "SELECT COUNT(*) as count FROM assignments"
    );

    // Get unread notifications count for current user
    const unreadNotificationsResult = await queryRawSQL(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE",
      [userId]
    );

    const stats = {
      totalMembers: parseInt(totalMembersResult.rows[0].count),
      activeEvents: parseInt(activeEventsResult.rows[0].count),
      totalAssignments: parseInt(totalAssignmentsResult.rows[0].count),
      unreadNotifications: parseInt(unreadNotificationsResult.rows[0].count),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
