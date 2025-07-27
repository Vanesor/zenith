import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// PATCH /api/chat/messages/[id] - Update a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Update the message content and mark as edited
    const updateQuery = `
      UPDATE chat_messages
      SET content = $1, edited = true, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await Database.query(updateQuery, [content, messageId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

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

    const fullMessage = await Database.query(fullMessageQuery, [messageId]);

    return NextResponse.json({ message: fullMessage.rows[0] });
  } catch (error) {
    console.error("Error updating chat message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;

    const deleteQuery = `
      DELETE FROM chat_messages
      WHERE id = $1
      RETURNING id
    `;

    const result = await Database.query(deleteQuery, [messageId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ id: messageId, deleted: true });
  } catch (error) {
    console.error("Error deleting chat message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
