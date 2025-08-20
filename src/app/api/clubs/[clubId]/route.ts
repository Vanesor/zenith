import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    // Connect to Prisma if not already connected
    await db.$connect();

    const club = await db.clubs.findUnique({
      where: { id: clubId },
      include: {
        users_clubs_coordinator_idTousers: {
          select: { name: true, email: true }
        },
        users_clubs_co_coordinator_idTousers: {
          select: { name: true, email: true }
        }
      }
    });
    
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Properly handle promises
    const [memberCount, events, posts] = await Promise.all([
      // Get club members count
      db.users.count({
        where: { club_id: clubId }
      }),
      // Get club events
      db.events.findMany({
        where: { club_id: clubId },
        orderBy: { event_date: 'desc' },
        take: 10
      }),
      // Get club posts
      db.posts.findMany({
        where: { club_id: clubId },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          users_posts_author_idTousers: {
            select: { name: true }
          }
        }
      })
    ]);

    return NextResponse.json({
      club: {
        ...club,
        coordinator: club.users_clubs_coordinator_idTousers,
        co_coordinator: club.users_clubs_co_coordinator_idTousers,
      },
      member_count: memberCount,
      events,
      posts: posts.map(post => ({
        ...post,
        author_name: post.users_posts_author_idTousers?.name || "Unknown",
      })),
    });

  } catch (error) {
    console.error("Error fetching club details:", error);
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}
