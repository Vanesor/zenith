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

// POST /api/comments/[id]/like - Like a comment
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id: commentId } = await params;

    // Check if comment exists
    const commentCheck = await Database.query(
      "SELECT id FROM comments WHERE id = $1",
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const existingLike = await Database.query(
      "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId]
    );

    if (existingLike.rows.length > 0) {
      return NextResponse.json(
        { error: "Comment already liked" },
        { status: 400 }
      );
    }

    // Add like
    await Database.query(
      "INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)",
      [commentId, userId]
    );

    // Get updated like count
    const likeCount = await Database.query(
      "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1",
      [commentId]
    );

    return NextResponse.json({ 
      message: "Comment liked successfully",
      likeCount: parseInt(likeCount.rows[0].count)
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id]/like - Unlike a comment
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id: commentId } = await params;

    // Check if user has liked this comment
    const existingLike = await Database.query(
      "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId]
    );

    if (existingLike.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not liked by user" },
        { status: 400 }
      );
    }

    // Remove like
    await Database.query(
      "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId]
    );

    // Get updated like count
    const likeCount = await Database.query(
      "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1",
      [commentId]
    );

    return NextResponse.json({ 
      message: "Comment unliked successfully",
      likeCount: parseInt(likeCount.rows[0].count)
    });
  } catch (error) {
    console.error("Error unliking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
