import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/posts/[postId]/comments - Get comments for a post
export async function GET(
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

    // Get comments for the post with author info
    const commentsQuery = `
      SELECT 
        c.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        0 as likes_count,
        false as is_liked
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await db.query(commentsQuery, [postId]);

    return NextResponse.json({
      success: true,
      comments: result.rows
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts/[postId]/comments - Add a comment to a post
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

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Create the comment
    const insertQuery = `
      INSERT INTO comments (post_id, author_id, content, parent_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, created_at
    `;

    const result = await db.query(insertQuery, [
      postId,
      userId,
      content.trim(),
      parent_id || null
    ]);

    // Update comments count in posts table
    await db.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    // Get the user's name for the response
    const userQuery = 'SELECT name FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    return NextResponse.json({
      success: true,
      comment: {
        id: result.rows[0].id,
        post_id: postId,
        author_id: userId,
        author_name: userResult.rows[0]?.name || 'Unknown',
        content: content.trim(),
        parent_id: parent_id || null,
        likes_count: 0,
        is_liked: false,
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
