import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// GET /api/chat/rooms?club_id=<clubId>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("club_id");

    const query = `
      SELECT 
        cr.*,
        u.name as creator_name,
        u.avatar as creator_avatar
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.created_by = u.id
      ${clubId ? "WHERE cr.club_id = $1" : ""}
      ORDER BY cr.type DESC, cr.name
    `;

    const params = clubId ? [clubId] : [];
    const chatRooms = await Database.query(query, params);

    return NextResponse.json({ chatRooms: chatRooms.rows });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms
export async function POST(request: NextRequest) {
  try {
    const { name, description, club_id, type, created_by } =
      await request.json();

    if (!name || !created_by) {
      return NextResponse.json(
        { error: "Name and created_by are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO chat_rooms (name, description, club_id, type, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await Database.query(query, [
      name,
      description,
      club_id,
      type || "public",
      created_by,
    ]);

    return NextResponse.json({ chatRoom: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 }
    );
  }
}
