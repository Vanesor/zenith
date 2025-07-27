import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

interface Props {
  params: { id: string };
}

// POST /api/events/[id]/register
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;
    const { user_id, registration_data } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingQuery = `
      SELECT id FROM event_registrations 
      WHERE event_id = $1 AND user_id = $2
    `;
    const existingResult = await Database.query(existingQuery, [id, user_id]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User already registered for this event" },
        { status: 409 }
      );
    }

    // Register user
    const registerQuery = `
      INSERT INTO event_registrations (event_id, user_id, registration_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await Database.query(registerQuery, [
      id,
      user_id,
      registration_data || {},
    ]);

    // Get user info for response
    const userQuery = `
      SELECT u.name, u.avatar, u.role
      FROM users u
      WHERE u.id = $1
    `;
    const userResult = await Database.query(userQuery, [user_id]);

    return NextResponse.json(
      {
        registration: result.rows[0],
        user: userResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/register
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const result = await Database.query(
      "DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/register - Get registrations for event
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const query = `
      SELECT 
        er.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at DESC
      LIMIT $2 OFFSET $3
    `;

    const registrations = await Database.query(query, [id, limit, offset]);

    return NextResponse.json({ registrations: registrations.rows });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
