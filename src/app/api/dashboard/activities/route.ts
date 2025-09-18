import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyToken } from '@/lib/auth-unified';

export async function GET(request: NextRequest) {
  console.log('🔍 ACTIVITIES API: Request received');
  try {
    // Get token from request header
    const token = request.headers.get('authorization')?.split(' ')[1];
    console.log('🔒 ACTIVITIES API: Token present:', !!token);
    
    if (!token) {
      console.log('❌ ACTIVITIES API: No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    console.log('🔑 ACTIVITIES API: Verifying token...');
    let userId: string;
    try {
      const decoded = await verifyToken(token);
      
      if (!decoded) {
        console.log('❌ ACTIVITIES API: Token verification returned null');
        return NextResponse.json({ error: 'Invalid token - null verification' }, { status: 401 });
      }
      
      // Check if decoded contains an id property
      if (typeof decoded === 'object') {
        console.log('✅ ACTIVITIES API: Token decoded type:', typeof decoded);
        console.log('✅ ACTIVITIES API: Token contains ID?', 'id' in decoded);
        console.log('✅ ACTIVITIES API: Token contains role?', 'role' in decoded);
        
        if (!('id' in decoded) || !decoded.id) {
          console.log('❌ ACTIVITIES API: Token missing ID property');
          return NextResponse.json({ error: 'Invalid token - missing ID' }, { status: 401 });
        }
        
        // Set userId for the rest of the function
        userId = decoded.id;
        console.log('✅ ACTIVITIES API: Token verified successfully for user:', userId);
      } else {
        console.log('❌ ACTIVITIES API: Token decoded to non-object:', typeof decoded);
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
      }
    } catch (error) {
      console.error('❌ ACTIVITIES API: Error during token verification:', error);
      return NextResponse.json({ error: 'Token verification error' }, { status: 401 });
    }

    let recentPosts;
    let upcomingEvents;
    
    try {
      // Get recent posts, limit to 3
      console.log('📚 ACTIVITIES API: Fetching recent posts for user:', userId);
      recentPosts = await db.query(`
        SELECT 
          p.id,
          p.title,
          p.created_at,
          c.name as club_name,
          COALESCE(u.first_name || ' ' || u.last_name, u.name, 'Unknown') as author_name
        FROM posts p
        JOIN clubs c ON p.club_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.user_id = $1
        WHERE cm.user_id = $1 OR p.is_public = true
        ORDER BY p.created_at DESC
        LIMIT 3
      `, [userId]);
      console.log('✅ ACTIVITIES API: Posts fetched successfully');
    } catch (error) {
      console.error('❌ ACTIVITIES API: Error fetching posts:', error);
      recentPosts = { rows: [] }; // Provide empty rows to prevent errors
    }

    try {
      // Get upcoming events, limit to 3
      console.log('📅 ACTIVITIES API: Fetching upcoming events for user:', userId);
      upcomingEvents = await db.query(`
        SELECT 
          e.id,
          e.title,
          e.event_date,
          c.name as club_name
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.user_id = $1
        WHERE (cm.user_id = $1 OR e.is_public = true)
          AND e.event_date >= CURRENT_DATE
        ORDER BY e.event_date ASC
        LIMIT 3
      `, [userId]);
      console.log('✅ ACTIVITIES API: Events fetched successfully');
    } catch (error) {
      console.error('❌ ACTIVITIES API: Error fetching events:', error);
      upcomingEvents = { rows: [] }; // Provide empty rows to prevent errors
    }

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
    const formattedPosts = recentPosts.rows.map((post: any) => ({
      type: 'post',
      id: post.id,
      title: post.title,
      time: formatTimeAgo(new Date(post.created_at)),
      club: post.club_name,
      author: post.author_name
    }));

    const formattedEvents = upcomingEvents.rows.map((event: any) => ({
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
