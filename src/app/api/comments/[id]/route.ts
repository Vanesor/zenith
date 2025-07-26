import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: { id: string };
}

// PUT /api/comments/[id] - Update comment (only by author within 3 hours or managers)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Get current comment
    const currentComment = await Database.query(
      "SELECT author_id, created_at FROM comments WHERE id = $1",
      [id]
    );

    if (currentComment.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = currentComment.rows[0];

    // Check if user is author or manager
    const user = await Database.getUserById(userId);
    const isAuthor = comment.author_id === userId;
    const isManager = user && [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to edit this comment" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can edit anytime)
    if (!isManager) {
      const createdAt = new Date(comment.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          { error: "You can only edit comments within 3 hours of creation" },
          { status: 403 }
        );
      }
    }

    const query = `
      UPDATE comments 
      SET content = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await Database.query(query, [content.trim(), id]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment (only by author within 3 hours or managers)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;

    // Get current comment
    const currentComment = await Database.query(
      "SELECT author_id, created_at FROM comments WHERE id = $1",
      [id]
    );

    if (currentComment.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = currentComment.rows[0];

    // Check if user is author or manager
    const user = await Database.getUserById(userId);
    const isAuthor = comment.author_id === userId;
    const isManager = user && [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can delete anytime)
    if (!isManager) {
      const createdAt = new Date(comment.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          { error: "You can only delete comments within 3 hours of creation" },
          { status: 403 }
        );
      }
    }

    // Delete the comment
    await Database.query("DELETE FROM comments WHERE id = $1", [id]);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
