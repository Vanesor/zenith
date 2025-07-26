import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// GET /api/discussions?club_id=<clubId>&limit=<limit>&offset=<offset>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("club_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const query = `
      SELECT 
        d.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar,
        (SELECT COUNT(*) FROM discussion_replies dr WHERE dr.discussion_id = d.id) as reply_count
      FROM discussions d
      JOIN users u ON d.author_id = u.id
      ${clubId ? "WHERE d.club_id = $1" : ""}
      ORDER BY d.pinned DESC, d.last_activity DESC
      LIMIT $${clubId ? "2" : "1"} OFFSET $${clubId ? "3" : "2"}
    `;

    const params = clubId ? [clubId, limit, offset] : [limit, offset];
    const discussions = await Database.query(query, params);

    return NextResponse.json({ discussions: discussions.rows });
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}

// POST /api/discussions
export async function POST(request: NextRequest) {
  try {
    const { title, description, club_id, category, tags, author_id } =
      await request.json();

    if (!title || !author_id) {
      return NextResponse.json(
        { error: "Title and author_id are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO discussions (title, description, author_id, club_id, category, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await Database.query(query, [
      title,
      description,
      author_id,
      club_id,
      category || "general",
      tags || [],
    ]);

    return NextResponse.json({ discussion: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      { error: "Failed to create discussion" },
      { status: 500 }
    );
  }
}
