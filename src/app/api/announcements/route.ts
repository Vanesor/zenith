import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const clubId = searchParams.get("clubId");

    let announcements;
    if (clubId) {
      const result = await Database.query(
        `SELECT * FROM announcements 
         WHERE club_id = $1 OR club_id IS NULL 
         ORDER BY created_at DESC 
         ${limit ? "LIMIT $2" : ""}`,
        limit ? [clubId, parseInt(limit)] : [clubId]
      );
      announcements = result.rows;
    } else {
      announcements = await Database.getAnnouncements(
        limit ? parseInt(limit) : undefined
      );
    }

    // Get announcement details with author info
    const announcementsWithDetails = await Promise.all(
      announcements.map(async (announcement) => {
        const [author, club] = await Promise.all([
          Database.getUserById(announcement.author_id),
          announcement.club_id
            ? Database.getClubById(announcement.club_id)
            : null,
        ]);

        return {
          ...announcement,
          author: author
            ? {
                name: author.name,
                avatar: author.avatar,
                role: author.role,
              }
            : null,
          club: club ? { name: club.name, color: club.color } : null,
        };
      })
    );

    return NextResponse.json(announcementsWithDetails);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      type,
      author_id,
      club_id,
      target_audience,
      priority,
      expires_at,
    } = body;

    // Validate required fields
    if (!title || !content || !type || !author_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const announcement = await Database.createAnnouncement({
      title,
      content,
      type,
      author_id,
      club_id: club_id || null,
      target_audience: target_audience || "all",
      priority: priority || "medium",
      expires_at: expires_at ? new Date(expires_at) : undefined,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
