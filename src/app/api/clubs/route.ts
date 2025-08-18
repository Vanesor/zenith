import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Get clubs with basic info
    const clubs = await db.clubs.findMany({
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        logo_url: true,
        banner_image_url: true,
        type: true,
        icon: true,
        color: true,
        member_count: true
      }
    });

    // Get member counts and other stats for each club
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        // Get member count
        const memberCount = await db.users.count({
          where: { club_id: club.id }
        });

        // Get upcoming event count
        const eventCount = await db.events.count({
          where: {
            club_id: club.id,
            event_date: {
              gte: new Date()
            }
          }
        });

        // Get post count (assuming posts table exists with club_id)
        let postCount = 0;
        try {
          postCount = await db.posts.count({
            where: { club_id: club.id }
          });
        } catch (error) {
          // Posts table might not exist or might not have club_id
          console.log('Could not fetch post count for club:', club.id);
        }

        // Get leadership info
        let leadership: any[] = [];
        try {
          leadership = await db.users.findMany({
            where: {
              club_id: club.id,
              role: {
                in: [
                  'coordinator', 'co_coordinator', 'secretary', 'media',
                  'president', 'vice_president', 'innovation_head', 'treasurer', 'outreach'
                ]
              }
            },
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true
            },
            orderBy: {
              role: 'asc'
            }
          });
        } catch (error) {
          console.log('Could not fetch leadership for club:', club.id);
        }

        return {
          ...club,
          memberCount,
          eventCount,
          postCount,
          leadership,
        };
      })
    );

    return NextResponse.json(clubsWithStats);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}
