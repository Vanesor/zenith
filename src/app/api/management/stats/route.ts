import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database-consolidated";
import jwt from "jsonwebtoken";

// GET /api/management/stats
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const userId = decoded.userId;

    // Check if user is a manager (has management role)
    const userResult = await Database.query(
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
    const totalMembersResult = await Database.query(
      "SELECT COUNT(*) as count FROM users WHERE club_id IS NOT NULL"
    );

    // Get active events count (events happening in the future)
    const activeEventsResult = await Database.query(
      "SELECT COUNT(*) as count FROM events WHERE event_date >= CURRENT_DATE"
    );

    // Get total assignments count
    const totalAssignmentsResult = await Database.query(
      "SELECT COUNT(*) as count FROM assignments"
    );

    // Get unread notifications count for current user using PrismaDB
    const unreadNotifications = await Database.getUnreadNotificationCount(userId);

    const stats = {
      totalMembers: parseInt(totalMembersResult.rows[0].count),
      activeEvents: parseInt(activeEventsResult.rows[0].count),
      totalAssignments: parseInt(totalAssignmentsResult.rows[0].count),
      unreadNotifications,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching management stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
