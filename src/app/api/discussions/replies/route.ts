import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// POST /api/discussions/replies
export async function POST(request: NextRequest) {
  try {
    const { discussion_id, author_id, content, parent_id, attachments } =
      await request.json();

    if (!discussion_id || !author_id || !content) {
      return NextResponse.json(
        { error: "discussion_id, author_id, and content are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO discussion_replies (discussion_id, author_id, content, parent_id, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await Database.query(query, [
      discussion_id,
      author_id,
      content,
      parent_id || null,
      attachments || [],
    ]);

    // Update discussion last_activity
    await Database.query(
      "UPDATE discussions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1",
      [discussion_id]
    );

    // Get full reply data with user info
    const fullReplyQuery = `
      SELECT 
        dr.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM discussion_replies dr
      JOIN users u ON dr.author_id = u.id
      WHERE dr.id = $1
    `;

    const fullReply = await Database.query(fullReplyQuery, [result.rows[0].id]);

    return NextResponse.json({ reply: fullReply.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion reply:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
