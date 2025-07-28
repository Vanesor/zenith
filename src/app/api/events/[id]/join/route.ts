import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

// POST /api/events/[id]/join - Join an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const eventId = params.id;

    // Check if the event exists
    const eventQuery = `
      SELECT e.*, c.name as club_name
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      WHERE e.id = $1
    `;
    const eventResult = await Database.query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Check if user is already attending
    const attendeeQuery = `
      SELECT * FROM event_attendees 
      WHERE event_id = $1 AND user_id = $2
    `;
    const attendeeResult = await Database.query(attendeeQuery, [eventId, userId]);

    if (attendeeResult.rows.length > 0) {
      return NextResponse.json({ 
        message: "You are already attending this event",
        isAttending: true
      });
    }

    // Check if event is at capacity
    if (event.max_attendees) {
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM event_attendees 
        WHERE event_id = $1
      `;
      const countResult = await Database.query(countQuery, [eventId]);
      const currentAttendees = parseInt(countResult.rows[0].count);

      if (currentAttendees >= event.max_attendees) {
        return NextResponse.json(
          { error: "Event is at full capacity" },
          { status: 400 }
        );
      }
    }

    // Add user as an attendee
    await Database.query(
      "INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)",
      [eventId, userId]
    );

    // Create notification for the event creator
    await createNotification({
      type: 'event_joined',
      content: `A user has joined your event: ${event.title}`,
      userId,
      referenceId: event.id,
      referenceType: 'event',
      recipientId: event.created_by, // Send to event creator
      scope: 'private'
    });

    return NextResponse.json({
      message: "Successfully joined the event",
      isAttending: true
    });
  } catch (error) {
    console.error("Error joining event:", error);
    return NextResponse.json(
      { error: "Failed to join event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/join - Leave an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const eventId = params.id;

    // Check if the event exists
    const eventQuery = "SELECT * FROM events WHERE id = $1";
    const eventResult = await Database.query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is attending
    const attendeeQuery = `
      SELECT * FROM event_attendees 
      WHERE event_id = $1 AND user_id = $2
    `;
    const attendeeResult = await Database.query(attendeeQuery, [eventId, userId]);

    if (attendeeResult.rows.length === 0) {
      return NextResponse.json({ 
        message: "You are not attending this event",
        isAttending: false
      });
    }

    // Remove user as an attendee
    await Database.query(
      "DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    );

    return NextResponse.json({
      message: "Successfully left the event",
      isAttending: false
    });
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 }
    );
  }
}

// Helper function to create notifications
async function createNotification(params: {
  type: string;
  content: string;
  userId: string;
  referenceId: string;
  referenceType: string;
  recipientId?: string;
  clubId?: string;
  scope: 'public' | 'club' | 'private';
}) {
  try {
    const {
      type,
      content,
      userId,
      referenceId,
      referenceType,
      recipientId,
      clubId,
      scope
    } = params;

    // Calculate expiration (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Create base notification record
    const insertQuery = `
      INSERT INTO notifications (
        type, content, created_by, reference_id, reference_type, club_id, scope, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const insertResult = await Database.query(insertQuery, [
      type,
      content,
      userId,
      referenceId,
      referenceType,
      clubId || null,
      scope,
      expiresAt.toISOString()
    ]);
    
    const notificationId = insertResult.rows[0].id;
    
    if (recipientId) {
      // Add notification for a specific user
      await Database.query(
        "INSERT INTO user_notifications (user_id, notification_id) VALUES ($1, $2)",
        [recipientId, notificationId]
      );
    } else {
      // Distribute notification to relevant users based on scope
      let usersQuery = "";
      let queryParams = [notificationId];
      
      if (scope === 'public') {
        // Send to all users
        usersQuery = `
          INSERT INTO user_notifications (user_id, notification_id)
          SELECT id, $1 FROM users
        `;
      } else if (scope === 'club' && clubId) {
        // Send to users in the club
        usersQuery = `
          INSERT INTO user_notifications (user_id, notification_id)
          SELECT id, $1 FROM users WHERE club_id = $2
        `;
        queryParams.push(clubId);
      } else if (scope === 'private') {
        // Send only to creator
        usersQuery = `
          INSERT INTO user_notifications (user_id, notification_id)
          VALUES ($2, $1)
        `;
        queryParams.push(userId);
      }
      
      await Database.query(usersQuery, queryParams);
    }
    
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
