import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/clubs/[clubId]/posts - Get posts for a specific club
export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const { clubId } = await params;

    // Get posts for the club with author info and interaction counts
    const postsQuery = `
      SELECT 
        p.*,
        u.name as author_name,
        u.role as author_role,
        c.name as club_name,
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(comment_counts.comments_count, 0) as comments_count,
        CASE WHEN user_likes.id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN user_bookmarks.id IS NOT NULL THEN true ELSE false END as is_bookmarked,
        CEIL(LENGTH(p.content) / 200.0) as reading_time,
        0 as views_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      JOIN clubs c ON p.club_id = c.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count
        FROM likes
        GROUP BY post_id
      ) like_counts ON p.id = like_counts.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count
        FROM comments
        GROUP BY post_id
      ) comment_counts ON p.id = comment_counts.post_id
      LEFT JOIN likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = $2
      LEFT JOIN (
        SELECT post_id, user_id, id FROM likes WHERE user_id = $2
      ) user_bookmarks ON p.id = user_bookmarks.post_id
      WHERE p.club_id = $1 AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    const result = await db.query(postsQuery, [clubId, userId]);
    
    // Process tags (assuming they're stored as comma-separated strings)
    const posts = result.rows.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
      excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')
    }));

    return NextResponse.json({
      success: true,
      posts
    });

  } catch (error) {
    console.error('Error fetching club posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/clubs/[clubId]/posts - Create a new post
export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const { clubId } = await params;

    const body = await request.json();
    const { title, content, tags, excerpt, status, slug: providedSlug } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const slug = providedSlug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists and make it unique if needed
    const existingSlugQuery = 'SELECT id FROM posts WHERE slug LIKE $1';
    const existingSlugResult = await db.query(existingSlugQuery, [`${slug}%`]);
    
    let finalSlug = slug;
    if (existingSlugResult.rows.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    // Create the post
    const insertQuery = `
      INSERT INTO posts (
        title, content, slug, author_id, club_id, tags, excerpt, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, created_at
    `;

    // Convert tags array to PostgreSQL text array format
    const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []);
    
    const result = await db.query(insertQuery, [
      title,
      content,
      finalSlug,
      userId,
      clubId,
      tagsArray,
      excerpt || content.substring(0, 200) + '...',
      status || 'published'
    ]);

    return NextResponse.json({
      success: true,
      post: {
        id: result.rows[0].id,
        title,
        content,
        slug: finalSlug,
        author_id: userId,
        club_id: clubId,
        tags: tagsArray,
        excerpt: excerpt || content.substring(0, 200) + '...',
        status: status || 'published',
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
