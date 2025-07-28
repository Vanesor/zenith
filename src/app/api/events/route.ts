import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const clubId = searchParams.get("clubId");

    // Get events with attendee information - show all public events plus club-specific ones
    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.event_time as "startTime",
        e.location,
        e.max_attendees as "maxAttendees",
        e.status,
        COALESCE(e.is_public, FALSE) as "isPublic",
        c.name as club,
        c.color as "clubColor",
        u.name as organizer,
        COALESCE(attendee_count.count, 0) as attendees,
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
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [userId];

    if (clubId) {
      query += ` AND e.club_id = $3`;
      queryParams.push(clubId);
    }

    query += ` ORDER BY e.event_date ASC`;

    if (limit) {
      query += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(parseInt(limit));
    }

    const result = await Database.query(query, queryParams);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    
    // Check if user has permission to create events (coordinator, co_coordinator, secretary, president, vice_president)
    const userResult = await Database.query(
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
    
    if (!userClubId) {
      return NextResponse.json({ error: "User not associated with any club" }, { status: 400 });
    }
    
    const body = await request.json();
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      maxAttendees,
      type = "meeting",
      isPublic = false,
    } = body;

    // Validate required fields
    if (!title || !date || !startTime || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the event
    const result = await Database.query(
      `INSERT INTO events (
        title,
        description,
        event_date,
        event_time,
        end_time,
        location,
        club_id,
        created_by,
        max_attendees,
        type,
        is_public,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        title,
        description,
        date,
        startTime,
        endTime || null,
        location,
        userClubId,
        userId,
        maxAttendees || null,
        type,
        isPublic,
        "upcoming"
      ]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    const eventId = result.rows[0].id;
    
    // Create a notification for club members
    await Database.query(
      `INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data
      )
      SELECT 
        u.id, 
        $1 as title, 
        $2 as message, 
        'event' as type,
        jsonb_build_object('eventId', $3, 'clubId', $4) as data
      FROM users u
      WHERE u.club_id = $4 AND u.id != $5`,
      [
        `New ${type} event created`,
        `A new ${type} event "${title}" has been scheduled for ${date}`,
        eventId,
        userClubId,
        userId
      ]
    );

    return NextResponse.json({ id: eventId, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
