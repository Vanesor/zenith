import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: Promise<{ clubId: string }>;
}

// GET /api/clubs/[clubId]/management - Get club management data
export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    const { clubId } = await params;

    // Check if user is a manager of this club
    const userQuery = `
      SELECT role, club_id FROM users WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isManager = [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    // Allow access if user is a manager AND either:
    // 1. The club ID matches their club_id, OR
    // 2. They have a management role (for system admins who might manage multiple clubs)
    if (!isManager || (user.club_id !== clubId && user.role !== "admin")) {
      console.log("Access denied to club management:", { 
        userId, 
        userRole: user.role, 
        userClubId: user.club_id, 
        requestedClubId: clubId,
        isManager
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get club info
    const clubQuery = `
      SELECT id, name, description, type, color 
      FROM clubs WHERE id = $1
    `;
    const clubResult = await db.query(clubQuery, [clubId]);

    if (clubResult.rows.length === 0) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Get club members
    const membersQuery = `
      SELECT id, name, email, role, created_at as joined_at, avatar
      FROM users 
      WHERE club_id = $1 
      ORDER BY 
        CASE role
          WHEN 'coordinator' THEN 1
          WHEN 'co_coordinator' THEN 2
          WHEN 'secretary' THEN 3
          WHEN 'president' THEN 4
          WHEN 'vice_president' THEN 5
          ELSE 6
        END,
        name ASC
    `;
    const membersResult = await db.query(membersQuery, [clubId]);

    // Get club events
    const eventsQuery = `
      SELECT 
        id, title, description, event_date, event_time, location,
        (SELECT COUNT(*) FROM event_attendees WHERE event_id = events.id) as attendees_count,
        CASE 
          WHEN event_date > CURRENT_DATE THEN 'upcoming'
          WHEN event_date = CURRENT_DATE THEN 'ongoing'
          ELSE 'completed'
        END as status
      FROM events 
      WHERE club_id = $1 
      ORDER BY event_date DESC
      LIMIT 10
    `;
    const eventsResult = await db.query(eventsQuery, [clubId]);

    // Get club assignments
    const assignmentsQuery = `
      SELECT 
        id, title, description, due_date, max_points,
        (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = assignments.id) as submissions_count,
        CASE 
          WHEN due_date > NOW() THEN 'active'
          ELSE 'closed'
        END as status
      FROM assignments 
      WHERE club_id = $1 
      ORDER BY due_date DESC
      LIMIT 10
    `;
    const assignmentsResult = await db.query(assignmentsQuery, [clubId]);

    // Get club stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE club_id = $1) as total_members,
        (SELECT COUNT(*) FROM events WHERE club_id = $1 AND event_date >= CURRENT_DATE) as active_events,
        (SELECT COUNT(*) FROM assignments WHERE club_id = $1 AND due_date > NOW()) as pending_assignments,
        (SELECT COUNT(*) FROM posts WHERE club_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)) as monthly_posts
    `;
    const statsResult = await db.query(statsQuery, [clubId]);

    return NextResponse.json({
      club: clubResult.rows[0],
      members: membersResult.rows,
      events: eventsResult.rows,
      assignments: assignmentsResult.rows,
      stats: {
        totalMembers: parseInt(statsResult.rows[0].total_members) || 0,
        activeEvents: parseInt(statsResult.rows[0].active_events) || 0,
        pendingAssignments:
          parseInt(statsResult.rows[0].pending_assignments) || 0,
        monthlyPosts: parseInt(statsResult.rows[0].monthly_posts) || 0,
      },
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
