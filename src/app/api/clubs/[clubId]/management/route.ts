import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: { clubId: string };
}

// GET /api/clubs/[clubId]/management - Get club management data
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { clubId } = await params;

    // Check if user is a manager of this club
    const userQuery = `
      SELECT role, club_id FROM users WHERE id = $1
    `;
    const userResult = await Database.query(userQuery, [userId]);

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

    if (!isManager || user.club_id !== clubId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get club info
    const clubQuery = `
      SELECT id, name, description, type, color 
      FROM clubs WHERE id = $1
    `;
    const clubResult = await Database.query(clubQuery, [clubId]);

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
    const membersResult = await Database.query(membersQuery, [clubId]);

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
    const eventsResult = await Database.query(eventsQuery, [clubId]);

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
    const assignmentsResult = await Database.query(assignmentsQuery, [clubId]);

    // Get club stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE club_id = $1) as total_members,
        (SELECT COUNT(*) FROM events WHERE club_id = $1 AND event_date >= CURRENT_DATE) as active_events,
        (SELECT COUNT(*) FROM assignments WHERE club_id = $1 AND due_date > NOW()) as pending_assignments,
        (SELECT COUNT(*) FROM posts WHERE club_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)) as monthly_posts
    `;
    const statsResult = await Database.query(statsQuery, [clubId]);

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
    console.error("Error fetching club management data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
