import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// GET /api/clubs/[clubId]/posts/[postId] - Get specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; postId: string }> }
) {
  try {
    const { clubId, postId } = await params;
    
    const result = await db.query(`
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar,
        u.profile_image_url as author_profile_image_url,
        u.role as author_role,
        c.name as club_name,
        c.icon as club_icon,
        c.logo_url as club_logo_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (
          SELECT COALESCE(
            CASE 
              WHEN u.role IN ('coordinator', 'co_coordinator', 'zenith_committee') THEN u.role
              WHEN u.club_id = p.club_id THEN 'member'
              ELSE 'visitor'
            END, 
            'visitor'
          )
        ) as author_club_role,
        uc.name as author_club_name,
        uc.color as author_club_color
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN clubs uc ON u.club_id = uc.id
      WHERE p.id = $1 AND p.club_id = $2 AND p.status = 'published'
    `, [postId, clubId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = result.rows[0];

    // Check if user liked the post and increment view count (if authenticated)
    let isLiked = false;
    try {
      const authResult = await verifyAuth(request);
      if (authResult.success && authResult.user?.id) {
        const likeResult = await db.query(
          'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
          [postId, authResult.user.id]
        );
        isLiked = likeResult.rows.length > 0;
      }
      
      // Increment view count once per request
      await db.query(
        'UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [postId]
      );
    } catch (error) {
      // User not authenticated, still increment view count
      await db.query(
        'UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [postId]
      );
    }

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: {
        id: post.author_id,
        name: post.author_name,
        avatar: post.author_avatar ? post.author_avatar : post.author_profile_image_url,
        profile_image_url: post.author_profile_image_url,
        role: post.author_role,
        clubRole: post.author_club_role,
        club: post.author_club_name ? {
          name: post.author_club_name,
          color: post.author_club_color
        } : null,
      },
      club: {
        id: post.club_id,
        name: post.club_name,
        icon: post.club_icon,
        logo_url: post.club_logo_url,
      },
      likeCount: parseInt(post.like_count) || 0,
      commentCount: parseInt(post.comment_count) || 0,
      viewCount: post.view_count || 0,
      isLiked,
      tags: Array.isArray(post.tags) ? post.tags : [],
      created_at: post.created_at,
      updated_at: post.updated_at,
    };

    return NextResponse.json({
      success: true,
      post: formattedPost
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
