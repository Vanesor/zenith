import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";
import AuditLogger from "@/lib/audit-logger";

// GET /api/chat/rooms/[id] - Get room details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // In Next.js 13+, params needs to be accessed from context
  const { id } = await context.params;
  console.log('GET /api/chat/rooms/[id] called with ID:', id);

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

    // Find room with member details using raw SQL
    const roomResult = await db.query(`
      SELECT 
        cr.id, cr.name, cr.description, cr.type, cr.created_by, 
        cr.created_at, cr.updated_at, cr.club_id, cr.members,
        c.name as club_name
      FROM chat_rooms cr
      LEFT JOIN clubs c ON cr.club_id = c.id
      WHERE cr.id = $1
    `, [id]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];

    // Get room members using raw SQL
    const membersResult = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.avatar, u.role
      FROM chat_room_members crm
      JOIN users u ON crm.user_id = u.id
      WHERE crm.chat_room_id = $1
    `, [id]);

    // Transform to match expected format
    const transformedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      club_id: room.club_id,
      members: room.members,
      club_name: room.club_name,
      chat_room_members: membersResult.rows.map(member => ({
        users: {
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.role
        }
      }))
    };

    // Check if user has access to the room
    const isMember = (room as any).chat_room_members.some((member: any) => member.user_id === userId);
    const isPublic = room.type === 'public';
    
    if (!isMember && !isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Format response
    return NextResponse.json({
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      created_at: room.created_at,
      club_id: room.club_id,
      users: (room as any).chat_room_members.map((member: any) => ({
        id: member.users.id,
        name: member.users.name,
        avatar_url: member.users.avatar,
        role: member.role
      }))
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    return NextResponse.json(
      { error: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/rooms/[id] - Update room name (managers only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // In Next.js 13+, params needs to be accessed from context
  const { id } = await context.params;
  console.log('PUT /api/chat/rooms/[id] called with ID:', id);
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Check if user is a manager and owns the room
    const roomResult = await db.query(
      `SELECT id, name, description, type, created_by, club_id FROM chat_rooms WHERE id = $1`,
      [id]
    );
    
    const userResult = await db.query(
      `SELECT role, club_id FROM users WHERE id = $1`,
      [userId]
    );

    if (roomResult.rows.length === 0 || userResult.rows.length === 0) {
      return NextResponse.json({ error: "Room or user not found" }, { status: 404 });
    }
    
    const room = roomResult.rows[0];
    const user = userResult.rows[0];

    // Check if user is a manager
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

    if (!isManager || room.created_by !== userId) {
      return NextResponse.json(
        { error: "Only the room creator can rename this room" },
        { status: 403 }
      );
    }

    // Check for duplicate room names within the same club
    const duplicateResult = await db.query(`
      SELECT id FROM chat_rooms 
      WHERE LOWER(name) = LOWER($1) AND club_id = $2 AND id != $3
    `, [name.trim(), user.club_id, id]);

    if (duplicateResult.rows.length > 0) {
      return NextResponse.json(
        { error: "A room with this name already exists in your club" },
        { status: 409 }
      );
    }

    // Update the room name
    const updateResult = await db.query(`
      UPDATE chat_rooms 
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, description, type, created_by, created_at, updated_at, club_id
    `, [name.trim(), id]);

    const updatedRoom = updateResult.rows[0];

    // Log audit event for chat room update
    await AuditLogger.logChatAction(
      'room_update',
      id,
      userId,
      { name: room.name }, // old values
      { name: updatedRoom.name }, // new values
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: "Room renamed successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/rooms/[id] - Delete room (managers only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // In Next.js 13+, params needs to be accessed from context
  const { id } = await context.params;
  console.log('DELETE /api/chat/rooms/[id] called with ID:', id);
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

    // Check if user is a manager and owns the room
    const roomResult = await db.query(
      `SELECT id, name, created_by FROM chat_rooms WHERE id = $1`,
      [id]
    );
    
    const userResult = await db.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );

    if (roomResult.rows.length === 0 || userResult.rows.length === 0) {
      return NextResponse.json({ error: "Room or user not found" }, { status: 404 });
    }
    
    const room = roomResult.rows[0];
    const user = userResult.rows[0];

    // Check if user is a manager
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

    if (!isManager || room.created_by !== userId) {
      return NextResponse.json(
        { error: "Only the room creator can delete this room" },
        { status: 403 }
      );
    }

    // Delete associated messages first (if chat_messages table exists)
    try {
      await db.query(`DELETE FROM chat_messages WHERE room_id = $1`, [id]);
    } catch (error) {
      console.log("No chat_messages table or no messages to delete");
    }

    // Delete the room
    await db.query(`DELETE FROM chat_rooms WHERE id = $1`, [id]);

    // Log audit event for chat room deletion
    await AuditLogger.logChatAction(
      'room_delete',
      id,
      userId,
      { name: room.name }, // old values
      undefined, // no new values
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
