import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// POST /api/clubs/[clubId]/posts/[postId]/comments/[commentId]/like - Toggle like on comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; postId: string; commentId: string }> }
) {
  try {
    const { clubId, postId, commentId } = await params;
    
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Check if comment exists
    const commentResult = await db.query(
      'SELECT id FROM comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already liked the comment
    const likeResult = await db.query(
      'SELECT id FROM likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    if (likeResult.rows.length > 0) {
      // Unlike the comment
      await db.query(
        'DELETE FROM likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      );
    } else {
      // Like the comment
      await db.query(
        'INSERT INTO likes (comment_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [commentId, userId]
      );
    }

    // Get updated like count
    const countResult = await db.query(
      'SELECT COUNT(*) as like_count FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    return NextResponse.json({
      success: true,
      likeCount: parseInt(countResult.rows[0].like_count),
      isLiked: likeResult.rows.length === 0 // If no like existed before, now it's liked
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
