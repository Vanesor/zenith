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
        co_coord.name as co_coordinator_name,
        co_coord.email as co_coordinator_email
      FROM clubs c
      LEFT JOIN users coord ON c.coordinator_id = coord.id
      LEFT JOIN users co_coord ON c.co_coordinator_id = co_coord.id
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
        WHERE p.club_id = $1 
        ORDER BY p.created_at DESC 
        LIMIT 10
      `, [clubId])
    ]);

    return NextResponse.json({
      club: {
        ...club,
        coordinator: {
          name: club.coordinator_name,
          email: club.coordinator_email
        },
        co_coordinator: {
          name: club.co_coordinator_name,
          email: club.co_coordinator_email
        }
      },
      member_count: parseInt(memberCountResult.rows[0].count),
      events: eventsResult.rows,
      posts: postsResult.rows
    });

  } catch (error) {
    console.error("Error fetching club details:", error);
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}
