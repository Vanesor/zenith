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

    // Get events with attendee information
    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        COALESCE(e.start_time, e.time) as "startTime",
        e.end_time as "endTime",
        e.location,
        e.type,
        e.max_attendees as "maxAttendees",
        c.name as club,
        u.name as organizer,
        COUNT(ea.user_id) as attendees,
        CASE WHEN eua.user_id IS NOT NULL THEN true ELSE false END as "isAttending"
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN event_attendees ea ON e.id = ea.event_id
      LEFT JOIN event_attendees eua ON e.id = eua.event_id AND eua.user_id = $1
      WHERE c.id IN (
        SELECT cm.club_id FROM club_members cm WHERE cm.user_id = $1
      )
    `;

    const queryParams: (string | number)[] = [userId];

    if (clubId) {
      query += ` AND e.club_id = $2`;
      queryParams.push(clubId);
    }

    query += ` GROUP BY e.id, c.name, u.name, eua.user_id ORDER BY e.date ASC`;

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
      date: new Date(date),
      time,
      location,
      club_id,
      created_by,
      max_attendees,
      attendees: [],
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
