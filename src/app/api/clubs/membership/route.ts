import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import db from "@/lib/database";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret";


// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userResult = await db.query(
      `SELECT id, email, name, role, club_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );
    return userResult.rows.length > 0 ? userResult.rows[0] : null;
  } catch {
    return null;
  }
}

// POST /api/clubs/join - Join a club (single club restriction)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { clubId } = await request.json();

    if (!clubId) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    // Check if user already has a club
    if (user.club_id) {
      return NextResponse.json(
        {
          error: "You can only be a member of one club at a time",
          currentClub: user.club_id,
        },
        { status: 400 }
      );
    }

    // Join the club using the database function
    await db.query(`UPDATE users SET club_id = $1, updated_at = NOW() WHERE id = $2`, [clubId, user.id]);

    // Get updated user info
    const updatedUser = await db.query(`SELECT id, email, name, role, club_id FROM users WHERE id = $1 AND deleted_at IS NULL`, [user.id]).then(r => r.rows[0] || null);
    const club = await db.query(`SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL`, [clubId]).then(r => r.rows[0] || null);

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${club?.name}!`,
      user: {
        ...updatedUser,
        club_id: clubId,
      },
    });
  } catch (error: unknown) {
    console.error("Join club error:", error);

    // Handle specific database constraint errors
    if (error instanceof Error && error.message?.includes("already a member")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}

// DELETE /api/clubs/leave - Leave current club
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.club_id) {
      return NextResponse.json(
        { error: "You are not a member of any club" },
        { status: 400 }
      );
    }

    const currentClub = await db.query(`SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL`, [user.club_id]).then(r => r.rows[0] || null);

    // Leave the club
    await db.query(`UPDATE users SET club_id = NULL, updated_at = NOW() WHERE id = $1`, [user.id]);

    return NextResponse.json({
      success: true,
      message: `Successfully left ${currentClub?.name}!`,
    });
  } catch (error) {
    console.error("Leave club error:", error);
    return NextResponse.json(
      { error: "Failed to leave club" },
      { status: 500 }
    );
  }
}

// PUT /api/clubs/switch - Switch to a different club
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { newClubId } = await request.json();

    if (!newClubId) {
      return NextResponse.json(
        { error: "New club ID is required" },
        { status: 400 }
      );
    }

    const oldClub = user.club_id
      ? await db.query(`SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL`, [user.club_id]).then(r => r.rows[0] || null)
      : null;
    const newClub = await db.query(`SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL`, [newClubId]).then(r => r.rows[0] || null);

    if (!newClub) {
      return NextResponse.json(
        { error: "Invalid club selected" },
        { status: 400 }
      );
    }

    // Switch clubs
    await db.query(`UPDATE users SET club_id = $1, updated_at = NOW() WHERE id = $2`, [newClubId, user.id]);

    return NextResponse.json({
      success: true,
      message: oldClub
        ? `Successfully switched from ${oldClub.name} to ${newClub.name}!`
        : `Successfully joined ${newClub.name}!`,
      previousClub: oldClub?.name,
      newClub: newClub.name,
    });
  } catch (error) {
    console.error("Switch club error:", error);
    return NextResponse.json(
      { error: "Failed to switch club" },
      { status: 500 }
    );
  }
}
