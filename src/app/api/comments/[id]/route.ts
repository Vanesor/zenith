import { NextRequest, NextResponse } from "next/server";
import db, { prismaClient as prisma } from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

// PUT /api/comments/[id] - Update comment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const commentResult = await db.executeRawSQL(
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

    const result = await db.executeRawSQL(
      "UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [content, id]
    );

    return NextResponse.json({ comment: result.rows[0] });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;

    const commentResult = await db.executeRawSQL(
      "SELECT author_id, created_at FROM comments WHERE id = $1",
      [id]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = commentResult.rows[0];
    const userResult = await db.executeRawSQL("SELECT role FROM users WHERE id = $1", [userId]);
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

    await db.executeRawSQL("DELETE FROM comments WHERE id = $1", [id]);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
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

    const result = await db.executeRawSQL(
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
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

