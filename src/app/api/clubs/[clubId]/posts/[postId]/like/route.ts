import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// POST /api/clubs/[clubId]/posts/[postId]/like - Toggle like on post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; postId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { clubId, postId } = await params;
    const userId = authResult.user.id;

    // Check if post exists
    const postResult = await db.query(
      'SELECT id FROM posts WHERE id = $1 AND club_id = $2',
      [postId, clubId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked the post
    const likeResult = await db.query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (likeResult.rows.length > 0) {
      // Unlike the post
      await db.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
    } else {
      // Like the post
      await db.query(
        'INSERT INTO likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [postId, userId]
      );
    }

    // Get updated like count
    const countResult = await db.query(
      'SELECT COUNT(*) as like_count FROM likes WHERE post_id = $1',
      [postId]
    );

    return NextResponse.json({
      success: true,
      likeCount: parseInt(countResult.rows[0].like_count),
      isLiked: likeResult.rows.length === 0 // If no like existed before, now it's liked
    });

  } catch (error) {
    console.error('Error toggling post like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
