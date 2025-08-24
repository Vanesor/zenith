import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: Promise<{ commentId: string }>;
}

// POST /api/comments/[commentId]/like - Toggle like on comment
export async function POST(request: NextRequest, { params }: Props) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    const { commentId } = await params;

    // Check if comment exists
    const commentCheck = await db.query(
      "SELECT id FROM comments WHERE id = $1",
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already liked this comment
    const existingLike = await db.query(
      "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId]
    );

    let isLiked = false;
    let likeCount = 0;

    if (existingLike.rows.length > 0) {
      // Unlike - remove like
      await db.query(
        "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
        [commentId, userId]
      );
    } else {
      // Like - add like
      await db.query(
        "INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES ($1, $2, NOW())",
        [commentId, userId]
      );
      isLiked = true;
    }

    // Get updated like count
    const likeCountResult = await db.query(
      "SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1",
      [commentId]
    );
    likeCount = parseInt(likeCountResult.rows[0].count);

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
      message: isLiked ? "Comment liked" : "Comment unliked"
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
