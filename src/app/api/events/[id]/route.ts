import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: { id: string };
}

// GET /api/events/[id] - Get single event
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const query = `
      SELECT 
        e.*,
        u.name as organizer_name,
        c.name as club_name,
        c.color as club_color,
        COUNT(er.user_id) as attendee_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.id = $1
      GROUP BY e.id, u.name, c.name, c.color
    `;

    const result = await Database.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event (only by organizer or managers)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;
    const { title, description, date, time, location, max_attendees } = await request.json();

    // Get current event
    const currentEvent = await Database.query(
      "SELECT organizer_id, created_at FROM events WHERE id = $1",
      [id]
    );

    if (currentEvent.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = currentEvent.rows[0];

    // Check if user is organizer or manager
    const user = await Database.getUserById(userId);
    const isOrganizer = event.organizer_id === userId;
    const isManager = user && [
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

    if (!isOrganizer && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    const query = `
      UPDATE events 
      SET title = $1, description = $2, date = $3, time = $4, location = $5, max_attendees = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await Database.query(query, [
      title, 
      description, 
      date, 
      time, 
      location, 
      max_attendees,
      id
    ]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event (only by organizer within 3 hours or managers)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;

    // Get current event
    const currentEvent = await Database.query(
      "SELECT organizer_id, created_at FROM events WHERE id = $1",
      [id]
    );

    if (currentEvent.rows.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = currentEvent.rows[0];

    // Check if user is organizer or manager
    const user = await Database.getUserById(userId);
    const isOrganizer = event.organizer_id === userId;
    const isManager = user && [
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

    if (!isOrganizer && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can delete anytime)
    if (!isManager) {
      const createdAt = new Date(event.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          { error: "You can only delete events within 3 hours of creation" },
          { status: 403 }
        );
      }
    }

    // Delete related data first (foreign key constraints)
    await Database.query("DELETE FROM event_registrations WHERE event_id = $1", [id]);
    
    // Delete the event
    await Database.query("DELETE FROM events WHERE id = $1", [id]);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
