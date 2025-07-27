import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";

interface Props {
  params: { id: string };
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

    const result = await Database.query(query, [commentId]);
    const count = parseInt(result.rows[0].count);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching comment like count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
