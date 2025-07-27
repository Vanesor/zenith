import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

// GET /api/users/badges?user_id=<userId>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT *
      FROM user_badges
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `;

    const badges = await Database.query(query, [userId]);

    return NextResponse.json({ badges: badges.rows });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch user badges" },
      { status: 500 }
    );
  }
}

// POST /api/users/badges
export async function POST(request: NextRequest) {
  try {
    const { user_id, badge_type, badge_name, description, icon, color } =
      await request.json();

    if (!user_id || !badge_type || !badge_name) {
      return NextResponse.json(
        { error: "user_id, badge_type, and badge_name are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO user_badges (user_id, badge_type, badge_name, description, icon, color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await Database.query(query, [
      user_id,
      badge_type,
      badge_name,
      description,
      icon,
      color,
    ]);

    return NextResponse.json({ badge: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user badge:", error);
    return NextResponse.json(
      { error: "Failed to create badge" },
      { status: 500 }
    );
  }
}
