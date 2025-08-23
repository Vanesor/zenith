import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/events/[id]/attend - Join an event
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: eventId } = await params;
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    
    // Check if event exists
    const eventCheck = await db.query(
      `SELECT id, max_attendees FROM events WHERE id = $1`,
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // Check if event has reached maximum attendees
    if (event.max_attendees) {
      const attendeeCountResult = await db.query(
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
    const attendCheck = await db.query(
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
    await db.query(
      `INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)`,
      [eventId, userId]
    );
    
    // Notify event organizer
    await db.query(
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
    const { id: eventId } = await params;
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
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
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    
    // Check if event exists
    const eventCheck = await db.query(
      `SELECT id FROM events WHERE id = $1`,
      [eventId]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // Check if user is attending
    const attendCheck = await db.query(
      `SELECT id FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    if (attendCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not attending this event" },
        { status: 400 }
      );
    }
    
    // Remove user from event attendees
    await db.query(
      `DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    // Notify event organizer
    await db.query(
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
    const { id: eventId } = await params;
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
}
