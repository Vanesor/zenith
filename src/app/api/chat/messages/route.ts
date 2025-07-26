import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// GET /api/chat/messages?room_id=<roomId>&limit=<limit>&offset=<offset>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!roomId) {
      return NextResponse.json(
        { error: "room_id is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        cm.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar,
        reply_msg.content as reply_content,
        reply_user.name as reply_author_name
      FROM chat_messages cm
      JOIN users u ON cm.author_id = u.id
      LEFT JOIN chat_messages reply_msg ON cm.reply_to = reply_msg.id
      LEFT JOIN users reply_user ON reply_msg.author_id = reply_user.id
      WHERE cm.room_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const messages = await Database.query(query, [roomId, limit, offset]);

    return NextResponse.json({ messages: messages.rows.reverse() });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages
export async function POST(request: NextRequest) {
  try {
    const { room_id, author_id, content, type, reply_to, attachments } =
      await request.json();

    if (!room_id || !author_id || !content) {
      return NextResponse.json(
        { error: "room_id, author_id, and content are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO chat_messages (room_id, author_id, content, type, reply_to, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await Database.query(query, [
      room_id,
      author_id,
      content,
      type || "text",
      reply_to || null,
      attachments || [],
    ]);

    // Get full message data with user info
    const fullMessageQuery = `
      SELECT 
        cm.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM chat_messages cm
      JOIN users u ON cm.author_id = u.id
      WHERE cm.id = $1
    `;

    const fullMessage = await Database.query(fullMessageQuery, [
      result.rows[0].id,
    ]);

    return NextResponse.json({ message: fullMessage.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
