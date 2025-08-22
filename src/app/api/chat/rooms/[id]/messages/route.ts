import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth, AuthenticatedRequest } from "@/lib/auth-unified";

// GET /api/chat/rooms/[id]/messages - Get messages for a specific room
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify authentication using the AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Verify user has access to this room using raw SQL
    const roomResult = await db.query(
      `SELECT id, type, club_id, created_by, members FROM chat_rooms WHERE id = $1`,
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];

    // Get user info to check access
    const userResult = await db.query(
      `SELECT club_id, role FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    // Check if user has access to the room
    const hasAccess = 
      room.type === 'public' || 
      room.club_id === user.club_id || 
      room.created_by === userId ||
      (room.members && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages for the room using raw SQL
    const messagesResult = await db.query(`
      SELECT 
        cm.id,
        cm.room_id,
        cm.sender_id,
        cm.user_id,
        cm.message,
        cm.content,
        cm.created_at,
        cm.updated_at,
        cm.is_edited,
        cm.reply_to_message_id,
        cm.message_type,
        cm.attachments,
        cm.reactions,
        u.name as sender_name,
        u.role,
        u.avatar
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [roomId, limit, offset]);

    const messages = messagesResult.rows;

    // Transform messages for client
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      room_id: msg.room_id,
      user_id: msg.sender_id || msg.user_id,
      message: msg.message || msg.content || '',
      sender_name: msg.sender_name || 'Unknown User',
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      is_edited: msg.is_edited,
      reply_to_message_id: msg.reply_to_message_id,
      message_type: msg.message_type || 'text',
      attachments: msg.attachments || [],
      reactions: msg.reactions || {},
    }));

    return NextResponse.json({ 
      messages: formattedMessages,
      total: messages.length, 
      hasMore: messages.length === limit 
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Error fetching chat messages: " + error },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms/[id]/messages - Send a message to a room
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;
    const body = await request.json();
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Verify user has access to this room using raw SQL
    const roomResult = await db.query(
      `SELECT id, type, club_id, created_by, members FROM chat_rooms WHERE id = $1`,
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];

    // Check if user is a member of the room (simplified access check)
    const hasAccess = 
      room.type === 'public' || 
      room.created_by === userId ||
      (room.members && Array.isArray(room.members) && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "You are not a member of this room" }, { status: 403 });
    }

    // Create the message using raw SQL
    const messageResult = await db.query(`
      INSERT INTO chat_messages (room_id, sender_id, message, content, message_type, reply_to_message_id, attachments, message_images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, room_id, sender_id, message, content, created_at, is_edited, reply_to_message_id, message_type, attachments
    `, [
      roomId,
      userId,
      body.message,
      body.message,
      body.message_type || 'text',
      body.reply_to_message_id || null,
      JSON.stringify(body.attachments || []),
      JSON.stringify(body.message_images || [])
    ]);

    const message = messageResult.rows[0];

    // Format response
    const formattedMessage = {
      id: message.id,
      room_id: message.room_id,
      user_id: message.sender_id,
      message: message.message || message.content || '',
      created_at: message.created_at,
      is_edited: message.is_edited,
      reply_to_message_id: message.reply_to_message_id,
      message_type: message.message_type || 'text',
      attachments: message.attachments || [],
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Error sending message: " + error },
      { status: 500 }
    );
  }
}
