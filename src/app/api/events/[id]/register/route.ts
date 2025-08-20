import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/events/[id]/register
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const { user_id, registration_data } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingResult = await db.query(`
      SELECT id FROM event_registrations 
      WHERE event_id = $1 AND user_id = $2
      LIMIT 1
    `, [id, user_id]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User already registered for this event" },
        { status: 409 }
      );
    }

    // Register user
    const registrationResult = await db.query(`
      INSERT INTO event_registrations (event_id, user_id, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `, [id, user_id]);

    const registration = registrationResult.rows[0];

    // Get user info for response
    const userResult = await db.query(`
      SELECT name, avatar, role 
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `, [user_id]);

    const user = userResult.rows[0];

    return NextResponse.json(
      {
        registration,
        user,
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const deleteResult = await db.query(`
      DELETE FROM event_registrations 
      WHERE event_id = $1 AND user_id = $2
      RETURNING id
    `, [id, userId]);

    if (deleteResult.rows.length === 0) {
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const registrationsResult = await db.query(`
      SELECT * FROM event_registrations 
      WHERE event_id = $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    return NextResponse.json({ registrations: registrationsResult.rows });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
