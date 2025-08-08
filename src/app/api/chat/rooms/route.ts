import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { verifyAuth } from "@/lib/AuthMiddleware";

// GET /api/chat/rooms - Get all chat rooms or by club
export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Get user info to determine accessible rooms
    const userQuery = `SELECT club_id, role FROM users WHERE id = $1`;
    const userResult = await Database.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("club_id") || user.club_id;

    const query = `
      SELECT 
        cr.*,
        c.name as club_name,
        u.name as creator_name,
        array_length(cr.members, 1) as members_count
      FROM chat_rooms cr
      LEFT JOIN clubs c ON cr.club_id = c.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.type = 'public' OR cr.club_id = $1 OR cr.created_by = $2
      ORDER BY cr.type DESC, cr.name
    `;

    const chatRooms = await Database.query(query, [clubId, userId]);

    return NextResponse.json({ rooms: chatRooms.rows });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms - Create new chat room (management only)
export async function POST(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    const { name, description, type = "club" } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Check if user is a manager
    const userQuery = `SELECT club_id, role FROM users WHERE id = $1`;
    const userResult = await Database.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    // Check for duplicate room names within the same club
    const duplicateQuery = `
      SELECT id FROM chat_rooms 
      WHERE LOWER(name) = LOWER($1) AND club_id = $2
    `;
    const duplicateResult = await Database.query(duplicateQuery, [
      name.trim(),
      user.club_id,
    ]);

    if (duplicateResult.rows.length > 0) {
      return NextResponse.json(
        { error: "A room with this name already exists in your club" },
        { status: 409 }
      );
    }
    const isManager = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (!isManager) {
      return NextResponse.json({ 
        error: "Only management positions can create chat rooms" 
      }, { status: 403 });
    }

    const query = `
      INSERT INTO chat_rooms (name, description, club_id, type, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *, 
        (SELECT name FROM clubs WHERE id = $3) as club_name,
        (SELECT name FROM users WHERE id = $5) as creator_name
    `;

    const result = await Database.query(query, [
      name.trim(),
      description?.trim() || "",
      user.club_id,
      type,
      userId,
    ]);

    const newRoom = { ...result.rows[0], members_count: 0 };

    return NextResponse.json({ 
      message: "Chat room created successfully",
      room: newRoom 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 }
    );
  }
}
