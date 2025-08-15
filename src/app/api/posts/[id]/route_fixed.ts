import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

interface Props {
  params: { id: string };
}

// GET /api/posts/[id] - Get single post
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const query = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar,
        c.name as club_name,
        c.color as club_color,
        COUNT(l.id) as like_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN post_likes l ON p.id = l.post_id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.avatar, c.name, c.color
    `;

    const result = await Database.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = result.rows[0];

    // Get comments
    const commentsQuery = `
      SELECT 
        c.*,
        u.name as author_name,
        u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;

    const commentsResult = await Database.query(commentsQuery, [id]);

    return NextResponse.json({
      ...post,
      comments: commentsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update post (only by author or managers)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const { id } = await params;
    const { title, content, tags } = await request.json();

    // Get current post
    const currentPost = await Database.query(
      "SELECT author_id, created_at FROM posts WHERE id = $1",
      [id]
    );

    if (currentPost.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = currentPost.rows[0];
    const user = await Database.getUserById(userId);
    const isAuthor = post.author_id === userId;

    // Check if user can edit (author within 3 hours or manager/admin)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const postCreatedAt = new Date(post.created_at);
    const canEditAsAuthor = isAuthor && postCreatedAt > threeDaysAgo;
    const canEditAsManager = user?.role === 'manager' || user?.role === 'admin';

    if (!canEditAsAuthor && !canEditAsManager) {
      return NextResponse.json(
        { error: "You can only edit your own posts within 3 days, or you need manager privileges" },
        { status: 403 }
      );
    }

    // Update post
    const updateQuery = `
      UPDATE posts 
      SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await Database.query(updateQuery, [title, content, tags, id]);

    return NextResponse.json({
      message: "Post updated successfully",
      post: updateResult.rows[0]
    });

  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete post (only by author or managers)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const { id } = await params;

    // Get current post
    const currentPost = await Database.query(
      "SELECT author_id FROM posts WHERE id = $1",
      [id]
    );

    if (currentPost.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = currentPost.rows[0];
    const user = await Database.getUserById(userId);
    const isAuthor = post.author_id === userId;
    const canDelete = isAuthor || user?.role === 'manager' || user?.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: "You can only delete your own posts or need manager privileges" },
        { status: 403 }
      );
    }

    // Delete post (this will cascade delete comments and likes)
    await Database.query("DELETE FROM posts WHERE id = $1", [id]);

    return NextResponse.json({
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
