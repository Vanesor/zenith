import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import { NotificationService } from "@/lib/NotificationService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const clubId = searchParams.get("clubId");

    let announcements;
    if (clubId) {
      const result = await db.query(`
        SELECT 
          id, title, content, priority, created_at, club_id, author_id
        FROM announcements
        WHERE (club_id = $1 OR club_id IS NULL)
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        ${limit ? 'LIMIT $2' : ''}
      `, limit ? [clubId, parseInt(limit)] : [clubId]);
      announcements = result.rows;
    } else {
      const result = await db.query(`
        SELECT 
          id, title, content, priority, created_at, club_id, author_id
        FROM announcements
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        ${limit ? 'LIMIT $1' : ''}
      `, limit ? [parseInt(limit)] : []);
      announcements = result.rows;
    }

    // Get author and club details for each announcement
    const announcementsWithDetails = await Promise.all(
      announcements.map(async (announcement: any) => {
        const authorResult = announcement.author_id
          ? await db.query(`
              SELECT id, name, email, avatar, role 
              FROM users 
              WHERE id = $1 AND deleted_at IS NULL
            `, [announcement.author_id])
          : { rows: [null] };

        const clubResult = announcement.club_id
          ? await db.query(`
              SELECT id, name, color, icon 
              FROM clubs 
              WHERE id = $1 AND deleted_at IS NULL
            `, [announcement.club_id])
          : { rows: [null] };

        return {
          ...announcement,
          author: authorResult.rows[0],
          club: clubResult.rows[0],
        };
      })
    );

    return NextResponse.json(announcementsWithDetails);
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = authResult.user;

    // Check if user has permission to create announcements
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { role: true, club_id: true }
    });

    if (!user || (user.role !== 'coordinator' && user.role !== 'co_coordinator')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { title, content, clubId, priority, expiresAt } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const announcement = await db.query(`
      INSERT INTO announcements (title, content, priority, author_id, club_id, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, title, content, priority, author_id, club_id, created_at
    `, [title, content, priority || 'normal', userId, clubId || null]);

    const newAnnouncement = announcement.rows[0];

    // Get author and club details
    const authorResult = await db.query(`
      SELECT id, name, email, avatar, role 
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `, [userId]);

    const clubResult = newAnnouncement.club_id
      ? await db.query(`
          SELECT id, name, color, icon 
          FROM clubs 
          WHERE id = $1 AND deleted_at IS NULL
        `, [newAnnouncement.club_id])
      : { rows: [null] };

    // Send notifications (optional - can be implemented later)
    console.log(`Announcement created: ${newAnnouncement.id} by user ${userId}`);

    return NextResponse.json({
      ...newAnnouncement,
      author: authorResult.rows[0],
      club: clubResult.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
