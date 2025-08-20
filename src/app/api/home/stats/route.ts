import { NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';

// GET /api/home/stats - Get dashboard statistics
export async function GET() {
  try {
    // Get overall statistics in a single optimized query
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events,
        (SELECT COUNT(*) FROM posts) as total_posts
    `;
    const statsResult = await queryRawSQL(statsQuery);

    // Get club statistics with member counts
    const clubStatsResult = await queryRawSQL(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(u.id)::INTEGER as member_count,
        COUNT(CASE WHEN e.event_date >= CURRENT_DATE THEN 1 END)::INTEGER as upcoming_events
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY member_count DESC
    `);

    // Get upcoming events with club information
    const upcomingEventsResult = await queryRawSQL(`
      SELECT 
        e.*,
        c.name as club_name,
        c.color as club_color,
        u.name as organizer_name
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.event_time ASC
      LIMIT 6
    `);

    // Get recent posts with author and club info
    const recentPostsResult = await queryRawSQL(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.tags,
        c.name as club_name,
        c.color as club_color,
        u.name as author_name,
        u.avatar as author_avatar
      FROM posts p
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 4
    `);

    const stats = {
      totalClubs: parseInt(statsResult.rows[0].total_clubs),
      totalMembers: parseInt(statsResult.rows[0].total_users),
      upcomingEvents: parseInt(statsResult.rows[0].upcoming_events),
      totalPosts: parseInt(statsResult.rows[0].total_posts),
    };

    return NextResponse.json({
      success: true,
      stats,
      clubs: clubStatsResult.rows,
      upcomingEvents: upcomingEventsResult.rows,
      recentPosts: recentPostsResult.rows,
    });
  } catch (error) {
    console.error("Home stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch home statistics" },
      { status: 500 }
    );
  }
}
