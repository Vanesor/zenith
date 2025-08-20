import { NextRequest, NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';

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
      SELECT 
        id, user_id, badge_name, badge_description, 
        badge_icon, earned_at
      FROM user_badges
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `;

          const badgeResults = await queryRawSQL(query, [userId]);

    return NextResponse.json({ badges: badgeResults.rows });
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
    const { user_id, badge_name, badge_description, badge_icon } =
      await request.json();

    if (!user_id || !badge_name) {
      return NextResponse.json(
        { error: "user_id and badge_name are required" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO user_badges (user_id, badge_name, badge_description, badge_icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await queryRawSQL(
      query, 
      user_id,
      badge_name,
      badge_description || null,
      badge_icon || null
    );

    return NextResponse.json({ badge: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user badge:", error);
    return NextResponse.json(
      { error: "Failed to create badge" },
      { status: 500 }
    );
  }
}
