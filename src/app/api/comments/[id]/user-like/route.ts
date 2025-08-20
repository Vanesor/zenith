import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/comments/[id]/user-like - Check if user has liked a comment
export async function GET(request: NextRequest, { params }: Props) {
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

    const { id: commentId } = await params;

    const query = `
      SELECT COUNT(*) as count 
      FROM comment_likes 
      WHERE comment_id = $1 AND user_id = $2
    `;

    const result = await db.query(query, [commentId, userId]);
    const isLiked = parseInt(result.rows[0].count) > 0;

    return NextResponse.json({ isLiked });
  } catch (error) {
    console.error("Error checking user comment like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
