import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/view - Track post view
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: postId } = await params;

    // Check if post exists
    const postResult = await Database.query(
      "SELECT id, view_count FROM posts WHERE id = $1",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Increment view count
    const result = await Database.query(
      "UPDATE posts SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count",
      [postId]
    );
    
    const viewCount = result.rows[0].view_count;

    return NextResponse.json({
      success: true,
      viewCount,
      message: "View recorded"
    });

  } catch (error) {
    console.error("Error tracking post view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
