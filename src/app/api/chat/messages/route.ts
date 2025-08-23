import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';
import AuditLogger from '@/lib/audit-logger';

// Helper function to check message edit/delete permissions
async function checkMessagePermissions(userId: string, messageId: string, action: 'edit' | 'delete') {
  const messageResult = await db.query(
    `SELECT cm.*, u.role, u.club_id, cmem.role as committee_role,
            c.coordinator_id, c.co_coordinator_id,
            EXTRACT(EPOCH FROM (NOW() - cm.created_at))/3600 as hours_ago
     FROM chat_messages cm
     LEFT JOIN users u ON cm.sender_id = u.id
     LEFT JOIN committee_members cmem ON u.id = cmem.user_id
     LEFT JOIN clubs c ON u.club_id = c.id
     WHERE cm.id = $1`,
    [messageId]
  );

  if (messageResult.rows.length === 0) {
    return { hasPermission: false, reason: "Message not found" };
  }

  const message = messageResult.rows[0];
  const hoursAgo = parseFloat(message.hours_ago);
  
  // Check if user is the message sender
  const isOwner = message.sender_id === userId;
  
  // Check if user has special permissions (committee members, coordinators)
  const hasSpecialPermission = 
    message.committee_role || 
    message.coordinator_id === userId || 
    message.co_coordinator_id === userId ||
    message.role === 'admin';

  // Owners can edit/delete within 2 hours
  if (isOwner && hoursAgo <= 2) {
    return { hasPermission: true, message };
  }
  
  // Special permission holders can edit/delete within 6 hours
  if (hasSpecialPermission && hoursAgo <= 6) {
    return { hasPermission: true, message };
  }

  const timeLimit = hasSpecialPermission ? '6 hours' : '2 hours';
  return { 
    hasPermission: false, 
    reason: `You can only ${action} messages within ${timeLimit} of posting` 
  };
}

// GET /api/chat/messages - Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Check if user has access to the room
    const roomResult = await db.query(
      `SELECT cr.*, u.club_id as user_club_id
       FROM chat_rooms cr, users u
       WHERE cr.id = $1 AND u.id = $2`,
      [roomId, userId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const room = roomResult.rows[0];
    
    // Check access permissions
    if (room.type === 'club' && room.club_id !== room.user_club_id) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      );
    }

    // Get messages with enhanced information
    const messagesResult = await db.query(
      `SELECT cm.*, u.name as sender_name, u.profile_image_url as sender_avatar,
              rm.message as reply_content, ru.name as reply_sender_name,
              EXTRACT(EPOCH FROM (NOW() - cm.created_at))/3600 as hours_ago,
              (cm.sender_id = $1) as is_owner,
              CASE WHEN cm.is_edited THEN cm.edited_at ELSE NULL END as edited_at
       FROM chat_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       LEFT JOIN chat_messages rm ON cm.reply_to_message_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE cm.room_id = $2
       ORDER BY cm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, roomId, limit, offset]
    );

    const messages = messagesResult.rows.map(msg => ({
      id: msg.id,
      content: msg.content || msg.message,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderAvatar: msg.sender_avatar || '/api/placeholder/32/32',
      timestamp: msg.created_at,
      isEdited: msg.is_edited,
      editedAt: msg.edited_at,
      isOwner: msg.is_owner,
      canEdit: msg.is_owner && parseFloat(msg.hours_ago) <= 2,
      canDelete: msg.is_owner && parseFloat(msg.hours_ago) <= 2,
      type: msg.message_type || 'text',
      replyTo: msg.reply_to_message_id ? {
        id: msg.reply_to_message_id,
        content: msg.reply_content,
        senderName: msg.reply_sender_name
      } : null
    })).reverse(); // Reverse to show oldest first

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Send a new message
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
    const { roomId, content, messageType = 'text', replyToMessageId } = await request.json();

    if (!roomId || !content?.trim()) {
      return NextResponse.json(
        { error: "Room ID and content are required" },
        { status: 400 }
      );
    }

    // Check room access
    const roomResult = await db.query(
      `SELECT cr.*, u.club_id as user_club_id
       FROM chat_rooms cr, users u
       WHERE cr.id = $1 AND u.id = $2`,
      [roomId, userId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const room = roomResult.rows[0];
    
    if (room.type === 'club' && room.club_id !== room.user_club_id) {
      return NextResponse.json(
        { error: "You don't have access to this room" },
        { status: 403 }
      );
    }

    // Calculate edit deadline (2 hours from now)
    const canEditUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Insert message
    const messageResult = await db.query(
      `INSERT INTO chat_messages (room_id, sender_id, message, message_type, reply_to_message_id, can_edit_until)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, room_id, sender_id, message, message_type, reply_to_message_id, created_at, can_edit_until`,
      [roomId, userId, content.trim(), messageType, replyToMessageId || null, canEditUntil]
    );

    const message = messageResult.rows[0];

    // Get sender details
    const senderResult = await db.query(
      `SELECT name, profile_image_url FROM users WHERE id = $1`,
      [userId]
    );

    const sender = senderResult.rows[0];

    const response = {
      id: message.id,
      roomId: message.room_id,
      content: message.message,
      senderId: message.sender_id,
      senderName: sender.name,
      senderAvatar: sender.profile_image_url || '/api/placeholder/32/32',
      timestamp: message.created_at,
      type: message.message_type,
      replyToMessageId: message.reply_to_message_id,
      isEdited: false,
      canEdit: true,
      canDelete: true
    };

    return NextResponse.json({ message: response }, { status: 201 });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT /api/chat/messages - Edit a message
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const { messageId, content } = await request.json();

    if (!messageId || !content?.trim()) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Check permissions
    const permissionCheck = await checkMessagePermissions(userId, messageId, 'edit');
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason },
        { status: 403 }
      );
    }

    // Update message
    const updateResult = await db.query(
      `UPDATE chat_messages 
       SET message = $1, is_edited = true, edited_at = NOW(), edited_by = $2
       WHERE id = $3
       RETURNING id, message, is_edited, edited_at`,
      [content.trim(), userId, messageId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    const updatedMessage = updateResult.rows[0];

    // Log audit event
    await AuditLogger.log({
      user_id: userId,
      action: 'message_edited',
      resource_type: 'chat_message',
      resource_id: messageId,
      metadata: { 
        newContent: content.trim(),
        editedAt: updatedMessage.edited_at
      }
    });

    return NextResponse.json({ 
      message: {
        ...updatedMessage,
        content: updatedMessage.message
      },
      success: "Message updated successfully" 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/messages - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const permissionCheck = await checkMessagePermissions(userId, messageId, 'delete');
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason },
        { status: 403 }
      );
    }

    // Delete message
    const deleteResult = await db.query(
      `DELETE FROM chat_messages WHERE id = $1 RETURNING id`,
      [messageId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Message not found or already deleted" },
        { status: 404 }
      );
    }

    // Log audit event
    await AuditLogger.log({
      user_id: userId,
      action: 'message_deleted',
      resource_type: 'chat_message',
      resource_id: messageId,
      metadata: { 
        deletedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: "Message deleted successfully" 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
