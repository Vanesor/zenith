import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : null;

    // Get clubs with all stats in a single optimized query
    const clubsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.logo_url,
        c.banner_image_url,
        c.type,
        c.icon,
        c.color,
        c.member_count,
        COUNT(DISTINCT u.id) as memberCount,
        COUNT(DISTINCT e.id) as eventCount,
        COUNT(DISTINCT p.id) as postCount
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id 
        AND e.event_date >= CURRENT_DATE
      LEFT JOIN posts p ON c.id = p.club_id
      GROUP BY c.id, c.name, c.description, c.created_at, c.logo_url, 
               c.banner_image_url, c.type, c.icon, c.color, c.member_count
      ORDER BY c.created_at DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const clubsResult = await db.query(clubsQuery);
    const clubs = clubsResult.rows;

    console.log(`📊 Found ${clubs.length} clubs in database`);

    // Get leadership info for each club in a separate optimized query
    const clubsWithStats = await Promise.all(
      clubs.map(async (club: any) => {
        let leadership: any[] = [];
        try {
          const leadershipResult = await db.query(`
            SELECT id, name, role, avatar 
            FROM users 
            WHERE club_id = $1 
              AND role IN ('coordinator', 'co_coordinator', 'secretary', 'media',
                          'president', 'vice_president', 'innovation_head', 'treasurer', 'outreach')
            ORDER BY role ASC
          `, [club.id]);
          
          leadership = leadershipResult.rows;
        } catch (error) {
          console.log('Could not fetch leadership for club:', club.id);
        }

        return {
          id: club.id,
          name: club.name,
          description: club.description,
          created_at: club.created_at,
          logo_url: club.logo_url,
          banner_image_url: club.banner_image_url,
          type: club.type,
          icon: club.icon,
          color: club.color,
          member_count: parseInt(club.membercount) || 0,
          memberCount: parseInt(club.membercount) || 0,
          eventCount: parseInt(club.eventcount) || 0,
          postCount: parseInt(club.postcount) || 0,
          leadership,
          coordinator_id: leadership.find(l => l.role === 'coordinator')?.id || null,
          coordinator_name: leadership.find(l => l.role === 'coordinator')?.name || 'TBA',
        };
      })
    );

    console.log(`📋 Returning ${clubsWithStats.length} clubs with full data`);
    return NextResponse.json({ success: true, clubs: clubsWithStats });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}
