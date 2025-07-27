import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const clubs = await Database.getAllClubs();

    // Get member counts for each club
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const members = await Database.getClubMembers(club.id);
        const events = await Database.getEventsByClub(club.id);
        const posts = await Database.getPostsByClub(club.id);
        const leadership = await Database.getClubLeadership(club.id);

        return {
          ...club,
          memberCount: members.length,
          eventCount: events.filter((e) => new Date(e.date) >= new Date())
            .length,
          postCount: posts.length,
          leadership,
        };
      })
    );

    if (limit) {
      return NextResponse.json(clubsWithStats.slice(0, parseInt(limit)));
    }

    return NextResponse.json(clubsWithStats);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}
