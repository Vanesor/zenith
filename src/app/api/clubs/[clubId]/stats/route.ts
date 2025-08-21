import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/clubs/[clubId]/stats - Get statistics for a specific club
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
    const { clubId } = await params;

    // Get club statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE club_id = $1) as total_members,
        (SELECT COUNT(*) FROM posts WHERE club_id = $1 AND status = 'published') as total_posts,
        (SELECT COUNT(*) FROM events WHERE club_id = $1) as total_events,
        (SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE club_id = $1) as total_likes,
        (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.club_id = $1) as total_comments,
        -- Calculate engagement rate (simplified) - likes + comments per post
        CASE 
          WHEN (SELECT COUNT(*) FROM posts WHERE club_id = $1) > 0 
          THEN ROUND(
            (
              (SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE club_id = $1) + 
              (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.club_id = $1)
            )::numeric / 
            (SELECT COUNT(*) FROM posts WHERE club_id = $1)::numeric * 100, 1
          )
          ELSE 0
        END as engagement_rate,
        -- Calculate growth rate (users joined in last 30 days vs total)
        CASE 
          WHEN (SELECT COUNT(*) FROM users WHERE club_id = $1) > 0
          THEN ROUND(
            (SELECT COUNT(*) FROM users WHERE club_id = $1 AND created_at > NOW() - INTERVAL '30 days')::numeric /
            (SELECT COUNT(*) FROM users WHERE club_id = $1)::numeric * 100, 1
          )
          ELSE 0
        END as growth_rate
    `;

    const result = await db.query(statsQuery, [clubId]);
    
    const stats = result.rows[0] || {
      total_members: 0,
      total_posts: 0,
      total_events: 0,
      total_likes: 0,
      engagement_rate: 0,
      growth_rate: 0
    };

    return NextResponse.json({
      success: true,
      stats: {
        total_members: parseInt(stats.total_members) || 0,
        total_posts: parseInt(stats.total_posts) || 0,
        total_events: parseInt(stats.total_events) || 0,
        total_likes: parseInt(stats.total_likes) || 0,
        engagement_rate: parseFloat(stats.engagement_rate) || 0,
        growth_rate: parseFloat(stats.growth_rate) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching club stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
