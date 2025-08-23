import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// POST /api/posts/[postId]/like - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const postId = params.postId;

    // Check if user has already liked this post
    const existingLikeQuery = 'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2';
    const existingLike = await db.query(existingLikeQuery, [postId, userId]);

    if (existingLike.rows.length > 0) {
      // Unlike the post
      await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      
      // Update likes count in posts table
      await db.query(
        'UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
        [postId]
      );

      return NextResponse.json({
        success: true,
        action: 'unliked'
      });
    } else {
      // Like the post
      await db.query(
        'INSERT INTO likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [postId, userId]
      );
      
      // Update likes count in posts table
      await db.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      );

      return NextResponse.json({
        success: true,
        action: 'liked'
      });
    }

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
