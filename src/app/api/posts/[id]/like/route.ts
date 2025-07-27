import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { NotificationService } from "@/lib/NotificationService";

// POST /api/posts/[id]/like - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    const { id: postId } = await params;

    if (!userId || !postId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already liked the post
    const existingLike = await Database.query(
      "SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );

    let liked = false;

    if (existingLike.rows.length > 0) {
      // Remove like
      await Database.query(
        "DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2",
        [postId, userId]
      );
      liked = false;
    } else {
      // Add like
      await Database.query(
        "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)",
        [postId, userId]
      );
      liked = true;
    }

    // Get updated like count
    const likeCountResult = await Database.query(
      "SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1",
      [postId]
    );

    const likeCount = parseInt(likeCountResult.rows[0].count);

    // Create notification for like (not for unlike)
    if (liked) {
      // Get post author info
      const postQuery = `
        SELECT author_id FROM posts WHERE id = $1
      `;
      const postResult = await Database.query(postQuery, [postId]);

      if (
        postResult.rows.length > 0 &&
        postResult.rows[0].author_id !== userId
      ) {
        // Get user name for notification
        const userQuery = `SELECT name FROM users WHERE id = $1`;
        const userResult = await Database.query(userQuery, [userId]);

        if (userResult.rows.length > 0) {
          await NotificationService.notifyLikeOnPost(
            postId,
            postResult.rows[0].author_id,
            userResult.rows[0].name
          );
        }
      }
    }

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error("Error toggling post like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
