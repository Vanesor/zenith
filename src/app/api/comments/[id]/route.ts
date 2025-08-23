import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from '@/lib/auth-unified';

// PUT /api/comments/[id] - Update comment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;

    const { id } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const commentResult = await db.query(
      "SELECT author_id, created_at FROM comments WHERE id = $1",
      [id]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = commentResult.rows[0];
    const isAuthor = comment.author_id === userId;

    const canEdit = () => {
      if (!isAuthor) return false;
      const created = new Date(comment.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffInHours <= 1;
    };

    if (!canEdit()) {
      return NextResponse.json(
        { error: "You can only edit your comments within 1 hour of posting." },
        { status: 403 }
      );
    }

    const result = await db.query(
      "UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [content, id]
    );

    return NextResponse.json({ comment: result.rows[0] });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;

    const { id } = await params;

    const commentResult = await db.query(
      "SELECT author_id, created_at FROM comments WHERE id = $1",
      [id]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = commentResult.rows[0];
    const userResult = await db.query("SELECT role FROM users WHERE id = $1", [userId]);
    const userRole = userResult.rows[0]?.role;

    const isAuthor = comment.author_id === userId;
    const isManager = [
      "coordinator", "co_coordinator", "secretary", "media",
      "president", "vice_president", "innovation_head", "treasurer", "outreach"
    ].includes(userRole);

    const canDelete = () => {
      if (isManager) return true;
      if (!isAuthor) return false;
      const created = new Date(comment.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffInHours <= 3;
    };

    if (!canDelete()) {
      return NextResponse.json(
        { error: "You do not have permission to delete this comment." },
        { status: 403 }
      );
    }

    await db.query("DELETE FROM comments WHERE id = $1", [id]);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/comments/[id] - Get single comment (can be used for fetching replies etc)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await db.query(
      `
      SELECT c.*, u.name as author_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ comment: result.rows[0] });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

