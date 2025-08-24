import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyToken } from '@/lib/auth-unified';

export async function GET(request: NextRequest) {
  try {
    // Get token from request header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    // Get recent posts, limit to 3
    const recentPosts = await db.raw(`
      SELECT 
        p.id,
        p.title,
        p.created_at,
        c.name as club_name,
        COALESCE(u.first_name || ' ' || u.last_name, u.name, 'Unknown') as author_name
      FROM posts p
      JOIN clubs c ON p.club_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.user_id = ?
      WHERE cm.user_id = ? OR p.is_public = true
      ORDER BY p.created_at DESC
      LIMIT 3
    `, [userId, userId]);

    // Get upcoming events, limit to 3
    const upcomingEvents = await db.raw(`
      SELECT 
        e.id,
        e.title,
        e.event_date,
        c.name as club_name
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.user_id = ?
      WHERE (cm.user_id = ? OR e.is_public = true)
        AND e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC
      LIMIT 3
    `, [userId, userId]);

    // Format the dates for better presentation
    const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    };

    // Transform the data for frontend consumption
    const formattedPosts = recentPosts.map((post: any) => ({
      type: 'post',
      id: post.id,
      title: post.title,
      time: formatTimeAgo(new Date(post.created_at)),
      club: post.club_name,
      author: post.author_name
    }));

    const formattedEvents = upcomingEvents.map((event: any) => ({
      type: 'event',
      id: event.id,
      title: event.title,
      time: new Date(event.event_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      club: event.club_name
    }));

    // Combine the activities
    const recentActivities = [...formattedPosts, ...formattedEvents]
      .sort((a, b) => {
        // For posts, sort by recency
        // For events, sort by upcoming date
        if (a.type === 'post' && b.type === 'post') {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        }
        return 0;
      })
      .slice(0, 4); // Limit to 4 activities total

    return NextResponse.json({ 
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
