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

    // Get user's club first
    const userResult = await Database.query(
      'SELECT club_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].club_id) {
      return NextResponse.json([]);
    }

    const userClubId = userResult.rows[0].club_id;

    // Get events with attendee information
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
      WHERE e.club_id = $2
    `;

    const queryParams: (string | number)[] = [userId, userClubId];

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
    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      location,
      club_id,
      created_by,
      max_attendees,
    } = body;

    // Validate required fields
    if (!title || !date || !time || !location || !club_id || !created_by) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = await Database.createEvent({
      title,
      description: description || "",
      event_date: new Date(date),
      event_time: time,
      location,
      club_id,
      created_by,
      max_attendees,
      status: "upcoming",
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
