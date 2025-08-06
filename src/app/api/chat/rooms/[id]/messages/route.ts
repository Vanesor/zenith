import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

// GET /api/chat/rooms/[id]/messages - Get messages for a specific room
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    // Verify user has access to this room
    const roomQuery = `
      SELECT cr.*, u.club_id, u.role 
      FROM chat_rooms cr
      JOIN users u ON u.id = $1
      WHERE cr.id = $2
    `;
    const roomResult = await Database.query(roomQuery, [userId, roomId]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];
    const userClubId = roomResult.rows[0].club_id;
    
    // Check if user has access to the room
    const hasAccess = 
      room.type === 'public' || 
      room.club_id === userClubId || 
      room.created_by === userId ||
      (room.members && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages for the room
    const query = `
      SELECT 
        cm.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.room_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const messages = await Database.query(query, [roomId, limit, offset]);

    return NextResponse.json({ 
      success: true,
      messages: messages.rows.reverse() 
    });

  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms/[id]/messages - Send a message to a specific room
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = params;

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { content, message_type, file_url } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this room
    const roomQuery = `
      SELECT cr.*, u.club_id, u.role 
      FROM chat_rooms cr
      JOIN users u ON u.id = $1
      WHERE cr.id = $2
    `;
    const roomResult = await Database.query(roomQuery, [userId, roomId]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];
    const userClubId = roomResult.rows[0].club_id;
    
    // Check if user has access to the room
    const hasAccess = 
      room.type === 'public' || 
      room.club_id === userClubId || 
      room.created_by === userId ||
      (room.members && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Insert the message
    const insertQuery = `
      INSERT INTO chat_messages (room_id, user_id, message, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await Database.query(insertQuery, [
      roomId,
      userId,
      content.trim(),
      message_type || "text",
      file_url || null,
    ]);

    // Get full message data with user info
    const fullMessageQuery = `
      SELECT 
        cm.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = $1
    `;

    const fullMessage = await Database.query(fullMessageQuery, [
      result.rows[0].id,
    ]);

    return NextResponse.json({ 
      success: true,
      message: fullMessage.rows[0] 
    }, { status: 201 });

  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/rooms/[id]/messages - Edit a message
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = params;

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { messageId, content } = await request.json();

    if (!messageId || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Verify user owns the message and has access to the room
    const messageQuery = `
      SELECT cm.*, cr.type as room_type, cr.club_id, cr.created_by as room_creator, u.club_id as user_club_id
      FROM chat_messages cm
      JOIN chat_rooms cr ON cm.room_id = cr.id
      JOIN users u ON u.id = $1
      WHERE cm.id = $2 AND cm.room_id = $3
    `;
    const messageResult = await Database.query(messageQuery, [userId, messageId, roomId]);

    if (messageResult.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const message = messageResult.rows[0];

    // Check if user owns the message
    if (message.user_id !== userId) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    // Update the message
    const updateQuery = `
      UPDATE chat_messages 
      SET message = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;

    const result = await Database.query(updateQuery, [content.trim(), messageId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: result.rows[0] 
    });

  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/rooms/[id]/messages - Delete a message
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = params;

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the message and has access to the room
    const messageQuery = `
      SELECT cm.*, cr.type as room_type, cr.club_id, cr.created_by as room_creator, u.club_id as user_club_id, u.role
      FROM chat_messages cm
      JOIN chat_rooms cr ON cm.room_id = cr.id
      JOIN users u ON u.id = $1
      WHERE cm.id = $2 AND cm.room_id = $3
    `;
    const messageResult = await Database.query(messageQuery, [userId, messageId, roomId]);

    if (messageResult.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const message = messageResult.rows[0];

    // Check if user owns the message or is a manager/admin
    const isOwner = message.user_id === userId;
    const isManager = [
      "coordinator", "co_coordinator", "secretary", "media", "president", 
      "vice_president", "innovation_head", "treasurer", "outreach"
    ].includes(message.role);

    if (!isOwner && !isManager) {
      return NextResponse.json({ 
        error: "You can only delete your own messages or you need manager permissions" 
      }, { status: 403 });
    }

    // Delete the message
    const deleteQuery = `
      DELETE FROM chat_messages 
      WHERE id = $1 AND room_id = $2
      RETURNING id
    `;

    const result = await Database.query(deleteQuery, [messageId, roomId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      messageId: result.rows[0].id
    });

  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
