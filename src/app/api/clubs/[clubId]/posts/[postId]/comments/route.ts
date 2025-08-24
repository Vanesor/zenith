import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// GET /api/clubs/[clubId]/posts/[postId]/comments - Get post comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; postId: string }> }
) {
  try {
    const { clubId, postId } = await params;
    
    const result = await db.query(`
      SELECT 
        c.*,
        u.name as author_name,
        u.avatar as author_avatar,
        u.profile_image_url as author_profile_image_url,
        u.role as author_role,
        (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) as like_count,
        (
          SELECT COALESCE(
            CASE 
              WHEN u.role IN ('coordinator', 'co_coordinator', 'zenith_committee') THEN u.role
              WHEN u.club_id = $2 THEN 'member'
              ELSE 'visitor'
            END, 
            'visitor'
          )
        ) as author_club_role,
        uc.name as author_club_name,
        uc.color as author_club_color
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN clubs uc ON u.club_id = uc.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId, clubId]);

    // Check if user liked each comment (if authenticated)
    let userLikes = new Set();
    try {
      const authResult = await verifyAuth(request);
      if (authResult.success && authResult.user?.id) {
        const likesResult = await db.query(
          'SELECT comment_id FROM likes WHERE user_id = $1 AND comment_id = ANY($2)',
          [authResult.user.id, result.rows.map(row => row.id)]
        );
        userLikes = new Set(likesResult.rows.map(row => row.comment_id));
      }
    } catch (error) {
      // User not authenticated, continue without like status
    }

    const comments = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar ? row.author_avatar : row.author_profile_image_url,
        profile_image_url: row.author_profile_image_url,
        role: row.author_role,
        clubRole: row.author_club_role,
        club: row.author_club_name ? {
          name: row.author_club_name,
          color: row.author_club_color
        } : null,
      },
      likeCount: parseInt(row.like_count) || 0,
      isLiked: userLikes.has(row.id),
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[clubId]/posts/[postId]/comments - Create new comment
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
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

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

    // Create comment
    const result = await db.query(`
      INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, created_at
    `, [postId, authResult.user.id, content.trim()]);

    return NextResponse.json({
      success: true,
      comment: {
        id: result.rows[0].id,
        content: content.trim(),
        author: {
          id: authResult.user.id,
          name: authResult.user.name,
          avatar: authResult.user.avatar,
          profile_image_url: authResult.user.profile_image_url,
        },
        likeCount: 0,
        isLiked: false,
        created_at: result.rows[0].created_at,
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
