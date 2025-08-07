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

// POST /api/events/[id]/attend - Join an event
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: eventId } = await params;
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    
    // Check if event exists
    const eventCheck = await Database.query(
      `SELECT * FROM events WHERE id = $1`,
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // Check if event has reached maximum attendees
    if (event.max_attendees) {
      const attendeeCountResult = await Database.query(
        `SELECT COUNT(*) as count FROM event_attendees WHERE event_id = $1`,
        [eventId]
      );
      
      const attendeeCount = parseInt(attendeeCountResult.rows[0].count);
      
      if (attendeeCount >= event.max_attendees) {
        return NextResponse.json(
          { error: "Event has reached maximum capacity" },
          { status: 400 }
        );
      }
    }
    
    // Check if user is already attending
    const attendCheck = await Database.query(
      `SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    if (attendCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "You are already attending this event" },
        { status: 400 }
      );
    }
    
    // Add user to event attendees
    await Database.query(
      `INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)`,
      [eventId, userId]
    );
    
    // Notify event organizer
    await Database.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        event.created_by,
        "New event attendee",
        `A user has joined your event "${event.title}"`,
        "event_join",
        JSON.stringify({ eventId, userId })
      ]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error joining event ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to join event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/attend - Leave an event
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id: eventId } = await params;
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    
    // Check if event exists
    const eventCheck = await Database.query(
      `SELECT * FROM events WHERE id = $1`,
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // Check if user is attending
    const attendCheck = await Database.query(
      `SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    if (attendCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not attending this event" },
        { status: 400 }
      );
    }
    
    // Remove user from event attendees
    await Database.query(
      `DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    // Notify event organizer
    await Database.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        event.created_by,
        "Event attendee left",
        `A user has left your event "${event.title}"`,
        "event_leave",
        JSON.stringify({ eventId, userId })
      ]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error leaving event ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
}
