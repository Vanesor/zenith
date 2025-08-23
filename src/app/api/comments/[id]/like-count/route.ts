import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/comments/[id]/like-count - Get like count for a comment
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id: commentId } = await params;

    const query = `
      SELECT COUNT(*) as count 
      FROM comment_likes 
      WHERE comment_id = $1
    `;

    const result = await db.query(query, [commentId]);
    const count = parseInt(result.rows[0].count);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
