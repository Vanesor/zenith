import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database-service';
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
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.event_time as "startTime",
        e.location,
        e.club_id as "clubId",
        e.created_by as "createdBy",
        e.max_attendees as "maxAttendees",
        e.status,
        e.image_url as "imageUrl",
        c.name as "clubName",
        c.color as "clubColor",
        u.name as "organizer",
        COALESCE(attendee_count.count, 0) as "attendeeCount",
        CASE WHEN user_attending.user_id IS NOT NULL THEN true ELSE false END as "isAttending"
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN (
        SELECT event_id, COUNT(*) as count
        FROM event_attendees
        GROUP BY event_id
      ) attendee_count ON e.id = attendee_count.event_id
      LEFT JOIN event_attendees user_attending ON e.id = user_attending.event_id AND user_attending.user_id = $1
      WHERE e.id = $2
    `;

    const result = await db.executeRawSQL(query, [userId, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Get the attendees for the event
    const attendeesResult = await db.executeRawSQL(
      `SELECT 
        u.id, 
        u.name, 
        u.profile_image as "profileImage",
        u.role
      FROM event_attendees ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
      ORDER BY u.name`,
      [id]
    );
    
    const event = result.rows[0];
    event.attendees = attendeesResult.rows;
    
    return NextResponse.json(event);
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
    // Use centralized authentication system
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;
    
    // Check if user has permission to update events using PrismaDB
    const user = await Database.getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = user.role;
    const userClubId = user.club_id;
    
    const allowedRoles = ["coordinator", "co_coordinator", "secretary", "president", "vice_president", "admin"];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    
    // Check if the event exists and belongs to the user's club
    const event = await Database.getEventById(id, userId);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // For admin role, they can update any club's events
    if (userRole !== "admin" && event.club_id !== userClubId) {
      return NextResponse.json(
        { error: "You can only update events for your club" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      description,
      date,
      startTime,
      location,
      maxAttendees,
      status,
      imageUrl
    } = body;
    
    // Validate required fields
    if (!title || !date || !startTime || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the event using raw query
    const updateQuery = `UPDATE events SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, max_attendees = $6, status = $7, image_url = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9`;
    await db.executeRawSQL(updateQuery, [title, description, date, startTime, location, maxAttendees || null, status || event.status, imageUrl || event.image_url, id]);
    
    // Get updated event
    const eventResult = await db.executeRawSQL('SELECT * FROM events WHERE id = $1', [id]);
    const updatedEvent = eventResult.rows[0];

    if (!updatedEvent) {
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }
    
    // Get attendees for email-only notifications
    const attendeesResult = await db.executeRawSQL('SELECT user_id as id FROM event_attendees WHERE event_id = $1', [id]);
    const attendees = attendeesResult.rows;
    const attendeeIds = (attendees as any[]).filter((a: any) => a.id !== userId).map((a: any) => a.id);
    
    // Create notifications for event attendees about the update
    if (attendeeIds.length > 0) {
      // TODO: Implement batch notification creation
      console.log(`Would send notifications to ${attendeeIds.length} attendees about event update`);
    }
    
    return NextResponse.json({ id, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
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
    
    // Check if user has permission to delete events
    const userResult = await db.executeRawSQL(
      `SELECT role, club_id FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    const allowedRoles = ["coordinator", "co_coordinator", "secretary", "president", "vice_president", "admin"];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    
    // Check if the event exists and belongs to the user's club
    const eventCheck = await db.executeRawSQL(
      `SELECT * FROM events WHERE id = $1`,
      [id]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // For admin role, they can delete any club's events
    if (userRole !== "admin" && event.club_id !== userClubId) {
      return NextResponse.json(
        { error: "You can only delete events for your club" },
        { status: 403 }
      );
    }
    
    // Create a notification for event attendees about the cancellation
    await db.executeRawSQL(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data
      )
      SELECT 
        ea.user_id, 
        $1 as title, 
        $2 as message, 
        'event_cancelled' as type,
        jsonb_build_object('eventId', $3, 'clubId', $4) as data
      FROM event_attendees ea
      WHERE ea.event_id = $3 AND ea.user_id != $5`,
      [
        `Event cancelled`,
        `The event "${event.title}" has been cancelled`,
        id,
        event.club_id,
        userId
      ]
    );
    
    // First, delete all attendees
    await db.executeRawSQL(
      `DELETE FROM event_attendees WHERE event_id = $1`,
      [id]
    );
    
    // Then, delete the event
    await db.executeRawSQL(
      `DELETE FROM events WHERE id = $1`,
      [id]
    );
    
    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
