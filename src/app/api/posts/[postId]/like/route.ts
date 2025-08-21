import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// POST /api/posts/[postId]/like - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
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
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
