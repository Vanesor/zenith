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

    // Get user info if authenticated (optional for views)
    let userId = null;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        userId = decoded.userId;
      } catch {
        // User not authenticated, still track anonymous view
      }
    }

    // Get IP address for anonymous view tracking
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Check if post exists
    const postResult = await Database.query(
      "SELECT id FROM posts WHERE id = $1",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if this user/IP already viewed this post recently (within 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingView = await Database.query(
      `SELECT id FROM post_views 
       WHERE post_id = $1 
       AND (
         (user_id = $2 AND user_id IS NOT NULL) 
         OR (ip_address = $3 AND user_id IS NULL)
       )
       AND created_at > $4`,
      [postId, userId, ipAddress, twentyFourHoursAgo]
    );

    if (existingView.rows.length === 0) {
      // Record new view
      await Database.query(
        `INSERT INTO post_views (post_id, user_id, ip_address, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [postId, userId, ipAddress]
      );
    }

    // Get updated view count
    const viewCountResult = await Database.query(
      "SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address)) as count FROM post_views WHERE post_id = $1",
      [postId]
    );
    
    const viewCount = parseInt(viewCountResult.rows[0].count);

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
