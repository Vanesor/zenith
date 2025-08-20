import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import AuditLogger from "@/lib/audit-logger";

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

    // Get user info to determine accessible rooms using raw SQL
    const userResult = await db.query(
      `SELECT club_id, role FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("club_id") || user.club_id;

    // Get chat rooms with club and creator information using raw SQL
    const roomsResult = await db.query(`
      SELECT 
        cr.id,
        cr.name,
        cr.description,
        cr.club_id,
        cr.type,
        cr.created_by,
        cr.created_at,
        cr.updated_at,
        cr.members,
        c.name as club_name,
        u.name as creator_name
      FROM chat_rooms cr
      LEFT JOIN clubs c ON cr.club_id = c.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE (cr.type = 'public' OR cr.club_id = $1 OR cr.created_by = $2)
      ORDER BY cr.type DESC, cr.name ASC
    `, [clubId, userId]);

    // Transform the data to match expected format
    const transformedRooms = roomsResult.rows.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      club_id: room.club_id,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      members: room.members,
      club_name: room.club_name,
      creator_name: room.creator_name,
      members_count: Array.isArray(room.members) ? room.members.length : 0
    }));
    
    return NextResponse.json({ rooms: transformedRooms });
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

    // Get user info using raw SQL
    const userResult = await db.query(
      `SELECT club_id, role FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // Check for duplicate room names within the same club
    const existingRoomResult = await db.query(`
      SELECT id FROM chat_rooms 
      WHERE LOWER(name) = LOWER($1) AND club_id = $2
    `, [name.trim(), user.club_id]);

    if (existingRoomResult.rows.length > 0) {
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

    // Create room using raw SQL
    const roomResult = await db.query(`
      INSERT INTO chat_rooms (name, description, club_id, type, created_by, members)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, club_id, type, created_by, created_at, updated_at, members
    `, [name.trim(), description || '', user.club_id, type, userId, JSON.stringify([])]);
    
    const room = roomResult.rows[0];
    
    // Get club and creator names
    const detailsResult = await db.query(`
      SELECT c.name as club_name, u.name as creator_name
      FROM clubs c, users u
      WHERE c.id = $1 AND u.id = $2
    `, [room.club_id, room.created_by]);
    
    const details = detailsResult.rows[0] || {};
    
    // Transform to match expected format
    const transformedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      club_id: room.club_id,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      members: room.members,
      club_name: details.club_name,
      creator_name: details.creator_name,
      members_count: Array.isArray(room.members) ? room.members.length : 0
    };

    // Log audit event for chat room creation
    await AuditLogger.logChatAction(
      'room_create',
      room.id,
      userId,
      undefined, // no old values
      {
        name: room.name,
        description: room.description,
        type: room.type,
        club_id: room.club_id
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ 
      message: "Chat room created successfully",
      room: transformedRoom 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 }
    );
  }
}
