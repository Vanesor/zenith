import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import jwt from "jsonwebtoken";
import { NotificationService } from "@/lib/NotificationService";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
}

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

// POST /api/announcements - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    const userId = decoded.userId;

    const userResult = await Database.query("SELECT role, club_id FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    const isManager = [
      "coordinator", "co_coordinator", "secretary", "media",
      "president", "vice_president", "innovation_head", "treasurer", "outreach"
    ].includes(user.role);

    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, club_id } = await request.json();
    
    const targetClubId = club_id || user.club_id;

    if (!targetClubId) {
      return NextResponse.json({ error: "Club ID is required for creating an announcement." }, { status: 400 });
    }

    const result = await Database.query(
      `INSERT INTO announcements (title, content, created_by, club_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, userId, targetClubId]
    );
    const newAnnouncement = result.rows[0];

    // Notify club members
    await NotificationService.notifyAnnouncement(targetClubId, newAnnouncement.title, newAnnouncement.content);

    return NextResponse.json({ announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
