import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';

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

    // Check if user is a member of the room
    const membershipResult = await db.query(
      `SELECT * FROM chat_room_members 
       WHERE chat_room_id = $1 AND user_id = $2`,
      [roomId, userId]
    );

    if (membershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this chat room" },
        { status: 403 }
      );
    }

    // Get messages
    const messagesResult = await db.query(
      `SELECT cm.*, u.name as sender_name, u.profile_image_url as sender_avatar,
              rm.content as reply_content, ru.name as reply_sender_name
       FROM chat_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       LEFT JOIN chat_messages rm ON cm.reply_to_message_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE cm.room_id = $1
       ORDER BY cm.created_at ASC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    const messages = messagesResult.rows.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      sender: {
        id: msg.sender_id,
        name: msg.sender_name,
        profile_image_url: msg.sender_avatar
      },
      reply_to: msg.reply_content ? {
        id: msg.reply_to_message_id,
        content: msg.reply_content,
        sender: {
          name: msg.reply_sender_name
        }
      } : null
    }));

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, message, messageType = 'text', replyToMessageId, attachments = [] } = body;

    if (!roomId || !message) {
      return NextResponse.json(
        { error: "roomId and message are required" },
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

    // Check if user is a member of the room
    const membershipResult = await db.query(
      `SELECT * FROM chat_room_members 
       WHERE chat_room_id = $1 AND user_id = $2`,
      [roomId, userId]
    );

    if (membershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this chat room" },
        { status: 403 }
      );
    }

    // Create the message
    const newMessageResult = await db.query(
      `INSERT INTO chat_messages (room_id, user_id, sender_id, message, message_type, reply_to_message_id, attachments, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, room_id, user_id, sender_id, message, message_type, reply_to_message_id, attachments, created_at`,
      [roomId, userId, userId, message, messageType, replyToMessageId || null, JSON.stringify(attachments)]
    );

    const newMessage = newMessageResult.rows[0];

    // Get sender details
    const senderResult = await db.query(
      `SELECT id, name, profile_image_url FROM users WHERE id = $1`,
      [userId]
    );

    const sender = senderResult.rows[0];

    // Format the response message
    const responseMessage = {
      ...newMessage,
      sender: {
        id: sender.id,
        name: sender.name,
        profile_image_url: sender.profile_image_url
      }
    };

    return NextResponse.json({ 
      success: true, 
      message: responseMessage 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
