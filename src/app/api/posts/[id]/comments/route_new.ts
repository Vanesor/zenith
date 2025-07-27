import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { NotificationService } from "@/lib/NotificationService";

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = await params;

    const query = `
      SELECT 
        c.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await Database.query(query, [postId]);

    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Add a comment to a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, author_id } = await request.json();
    const { id: postId } = await params;

    if (!content || !author_id || !postId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO comments (post_id, author_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await Database.query(query, [postId, author_id, content]);

    // Get full comment data with user info
    const fullCommentQuery = `
      SELECT 
        c.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `;

    const fullComment = await Database.query(fullCommentQuery, [
      result.rows[0].id,
    ]);

    // Get post author to send notification
    const postQuery = `SELECT author_id FROM posts WHERE id = $1`;
    const postResult = await Database.query(postQuery, [postId]);
    const postAuthorId = postResult.rows[0]?.author_id;

    // Create notification for post author
    if (postAuthorId && postAuthorId !== author_id) {
      await NotificationService.notifyCommentOnPost(
        postId,
        postAuthorId,
        fullComment.rows[0].author_name
      );
    }

    return NextResponse.json({ comment: fullComment.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
