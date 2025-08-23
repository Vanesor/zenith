import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import AuditLogger from "@/lib/audit-logger";

// Helper function to check permissions
async function checkChatRoomPermissions(userId: string, roomId?: string) {
  const userResult = await db.query(
    `SELECT u.role, u.club_id, cm.role as committee_role,
            c.coordinator_id, c.co_coordinator_id
     FROM users u
     LEFT JOIN committee_members cm ON u.id = cm.user_id
     LEFT JOIN clubs c ON u.club_id = c.id
     WHERE u.id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return { hasPermission: false, reason: "User not found" };
  }

  const user = userResult.rows[0];
  
  // Check if user has special permissions
  const hasSpecialPermission = 
    user.committee_role || 
    user.coordinator_id === userId || 
    user.co_coordinator_id === userId ||
    user.role === 'admin' ||
    user.role === 'coordinator';

  if (roomId) {
    // For specific room operations, also check if user created the room
    const roomResult = await db.query(
      `SELECT created_by FROM chat_rooms WHERE id = $1`,
      [roomId]
    );
    
    if (roomResult.rows.length === 0) {
      return { hasPermission: false, reason: "Room not found" };
    }
    
    const isCreator = roomResult.rows[0].created_by === userId;
    return { hasPermission: hasSpecialPermission || isCreator, user };
  }

  return { hasPermission: hasSpecialPermission, user };
}

// GET /api/chat/rooms/[id] - Get specific room details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await context.params;
  
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Get room details with access check
    const roomResult = await db.query(`
      SELECT 
        cr.*,
        c.name as club_name,
        u.name as creator_name,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) as message_count
      FROM chat_rooms cr
      LEFT JOIN clubs c ON cr.club_id = c.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.id = $1
    `, [roomId]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];

    // Check access permissions
    const userResult = await db.query(
      `SELECT club_id FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userClubId = userResult.rows[0].club_id;

    if (room.type === 'club' && room.club_id !== userClubId) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      );
    }

    return NextResponse.json({ room });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/rooms/[id] - Update room
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await context.params;
  
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Check permissions
    const permissionCheck = await checkChatRoomPermissions(userId, roomId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to edit this room" },
        { status: 403 }
      );
    }

    const { name, description, profile_picture_url } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Update room
    const updateResult = await db.query(`
      UPDATE chat_rooms 
      SET name = $1, description = $2, profile_picture_url = $3, updated_at = NOW(), edited_by = $4
      WHERE id = $5
      RETURNING *
    `, [name.trim(), description || '', profile_picture_url || null, userId, roomId]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Room not found or update failed" },
        { status: 404 }
      );
    }

    const updatedRoom = updateResult.rows[0];

    // Log audit event
    await AuditLogger.log({
      user_id: userId,
      action: 'chat_room_updated',
      resource_type: 'chat_room',
      resource_id: roomId,
      metadata: { 
        newName: name.trim(),
        newDescription: description || '',
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      room: updatedRoom,
      message: "Room updated successfully" 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/rooms/[id] - Delete room
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await context.params;
  
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Check permissions
    const permissionCheck = await checkChatRoomPermissions(userId, roomId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this room" },
        { status: 403 }
      );
    }

    // Get room details for audit log
    const roomResult = await db.query(
      `SELECT name, type, club_id FROM chat_rooms WHERE id = $1`,
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const room = roomResult.rows[0];

    // Delete associated messages first
    await db.query(`DELETE FROM chat_messages WHERE room_id = $1`, [roomId]);

    // Delete the room
    const deleteResult = await db.query(
      `DELETE FROM chat_rooms WHERE id = $1 RETURNING id`,
      [roomId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to delete room" },
        { status: 500 }
      );
    }

    // Log audit event
    await AuditLogger.log({
      user_id: userId,
      action: 'chat_room_deleted',
      resource_type: 'chat_room',
      resource_id: roomId,
      metadata: { 
        roomName: room.name,
        roomType: room.type,
        clubId: room.club_id,
        deletedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      message: "Room and all its messages deleted successfully" 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
