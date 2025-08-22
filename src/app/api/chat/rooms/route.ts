import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import AuditLogger from "@/lib/audit-logger";

// Helper function to check permissions
async function checkChatRoomPermissions(userId: string, action: 'create' | 'edit' | 'delete') {
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
  
  // Zenith committee members and club coordinators/co-coordinators can create/edit/delete
  const hasSpecialPermission = 
    user.committee_role || 
    user.coordinator_id === userId || 
    user.co_coordinator_id === userId ||
    user.role === 'admin' ||
    user.role === 'coordinator';

  if (action === 'create') {
    return { 
      hasPermission: hasSpecialPermission, 
      reason: hasSpecialPermission ? null : "Insufficient permissions to create chat rooms"
    };
  }

  return { hasPermission: hasSpecialPermission, user };
}

// GET /api/chat/rooms - Get all chat rooms or by club
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

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
        cr.profile_picture_url,
        c.name as club_name,
        u.name as creator_name,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) as message_count,
        (SELECT message FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM chat_rooms cr
      LEFT JOIN clubs c ON cr.club_id = c.id
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE (cr.type = 'public' OR (cr.type = 'club' AND cr.club_id = $1))
      ORDER BY cr.type DESC, cr.name ASC
    `, [clubId]);

    const transformedRooms = roomsResult.rows.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      club_id: room.club_id,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      members: room.members || [],
      profile_picture_url: room.profile_picture_url,
      club_name: room.club_name,
      creator_name: room.creator_name,
      message_count: parseInt(room.message_count) || 0,
      last_message: room.last_message,
      last_message_time: room.last_message_time,
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

// POST /api/chat/rooms - Create new chat room
export async function POST(request: NextRequest) {
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
    const permissionCheck = await checkChatRoomPermissions(userId, 'create');
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason },
        { status: 403 }
      );
    }

    const { name, description, type = "club", club_id, profile_picture_url } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Validate room type - only public and club allowed
    if (!['public', 'club'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid room type. Only 'public' and 'club' rooms are allowed" },
        { status: 400 }
      );
    }

    const userResult = await db.query(
      `SELECT club_id, role FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    const finalClubId = type === 'club' ? (club_id || user.club_id) : null;
    
    // Check for duplicate room names
    const duplicateCheckQuery = type === 'public' 
      ? `SELECT id FROM chat_rooms WHERE LOWER(name) = LOWER($1) AND type = 'public'`
      : `SELECT id FROM chat_rooms WHERE LOWER(name) = LOWER($1) AND club_id = $2`;
    
    const duplicateCheckParams = type === 'public' 
      ? [name.trim()]
      : [name.trim(), finalClubId];

    const existingRoomResult = await db.query(duplicateCheckQuery, duplicateCheckParams);

    if (existingRoomResult.rows.length > 0) {
      return NextResponse.json(
        { error: `A ${type} room with this name already exists` },
        { status: 409 }
      );
    }

    // Create room
    const roomResult = await db.query(`
      INSERT INTO chat_rooms (name, description, club_id, type, created_by, members, profile_picture_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, description, club_id, type, created_by, created_at, updated_at, members, profile_picture_url
    `, [name.trim(), description || '', finalClubId, type, userId, JSON.stringify([]), profile_picture_url || null]);
    
    const room = roomResult.rows[0];
    
    // Get additional details
    const detailsQuery = finalClubId 
      ? `SELECT c.name as club_name, u.name as creator_name FROM clubs c, users u WHERE c.id = $1 AND u.id = $2`
      : `SELECT u.name as creator_name FROM users u WHERE u.id = $1`;
    
    const detailsParams = finalClubId ? [finalClubId, room.created_by] : [room.created_by];
    const detailsResult = await db.query(detailsQuery, detailsParams);
    
    const details = detailsResult.rows[0] || {};
    
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
      profile_picture_url: room.profile_picture_url,
      club_name: details.club_name || null,
      creator_name: details.creator_name,
      members_count: Array.isArray(room.members) ? room.members.length : 0
    };

    // Log audit event
    await AuditLogger.log({
      user_id: userId,
      action: 'chat_room_created',
      resource_type: 'chat_room',
      resource_id: room.id,
      metadata: { 
        roomName: room.name, 
        roomType: room.type, 
        clubId: finalClubId 
      }
    });

    return NextResponse.json({ 
      room: transformedRoom,
      message: "Chat room created successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 }
    );
  }
}