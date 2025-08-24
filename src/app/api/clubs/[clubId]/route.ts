import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    // Get club details with members and content
    const clubQuery = `
      SELECT 
        c.*,
        coord.name as coordinator_name,
        coord.email as coordinator_email,
        coord.avatar as coordinator_avatar,
        coord.profile_image_url as coordinator_profile_image_url,
        co_coord.name as co_coordinator_name,
        co_coord.email as co_coordinator_email,
        co_coord.avatar as co_coordinator_avatar,
        co_coord.profile_image_url as co_coordinator_profile_image_url,
        secretary.name as secretary_name,
        secretary.email as secretary_email,
        secretary.avatar as secretary_avatar,
        secretary.profile_image_url as secretary_profile_image_url,
        media.name as media_name,
        media.email as media_email,
        media.avatar as media_avatar,
        media.profile_image_url as media_profile_image_url
      FROM clubs c
      LEFT JOIN users coord ON c.coordinator_id = coord.id
      LEFT JOIN users co_coord ON c.co_coordinator_id = co_coord.id
      LEFT JOIN users secretary ON c.secretary_id = secretary.id
      LEFT JOIN users media ON c.media_id = media.id
      WHERE c.id = $1
    `;
    
    const clubResult = await db.query(clubQuery, [clubId]);
    
    if (clubResult.rows.length === 0) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const club = clubResult.rows[0];

    // Get additional stats
    const [memberCountResult, eventsResult, postsResult] = await Promise.all([
      // Get club members count
      db.query('SELECT COUNT(*) as count FROM users WHERE club_id = $1', [clubId]),
      
      // Get club events
      db.query(`
        SELECT * FROM events 
        WHERE club_id = $1 
        ORDER BY event_date DESC 
        LIMIT 10
      `, [clubId]),
      
      // Get club posts with author info
      db.query(`
        SELECT p.*, u.name as author_name 
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.club_id = $1 AND p.status = 'published'
        ORDER BY p.created_at DESC 
        LIMIT 10
      `, [clubId])
    ]);

    return NextResponse.json({
      club: {
        ...club,
        memberCount: parseInt(memberCountResult.rows[0].count),
        coordinator: {
          name: club.coordinator_name,
          email: club.coordinator_email,
          avatar: club.coordinator_avatar,
          profile_image_url: club.coordinator_profile_image_url
        },
        co_coordinator: {
          name: club.co_coordinator_name,
          email: club.co_coordinator_email,
          avatar: club.co_coordinator_avatar,
          profile_image_url: club.co_coordinator_profile_image_url
        },
        secretary: {
          name: club.secretary_name,
          email: club.secretary_email,
          avatar: club.secretary_avatar,
          profile_image_url: club.secretary_profile_image_url
        },
        media: {
          name: club.media_name,
          email: club.media_email,
          avatar: club.media_avatar,
          profile_image_url: club.media_profile_image_url
        }
      },
      events: eventsResult.rows,
      posts: postsResult.rows
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}
