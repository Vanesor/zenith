import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

interface Props {
  params: Promise<{ clubId: string }>;
}

// GET /api/clubs/[clubId]/members - Get club members
export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const { clubId } = await params;

    // Get club members using direct SQL query
    // Note: There's a schema inconsistency - clubs.id is varchar but club_members.club_id is uuid
    // For now, return users who have this club_id in their user record
    const membersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
        u.profile_image_url,
        u.created_at as joined_at,
        u.role as member_role
      FROM users u
      WHERE u.club_id = $1
      ORDER BY u.created_at ASC
    `;

    const result = await db.query(membersQuery, [clubId]);
    const members = result.rows;

    return NextResponse.json({ members });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch club members" },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[clubId]/members - Add member to club
export async function POST(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;

    const { clubId } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user is a manager of this club
    const userQuery = `
      SELECT role, club_id FROM users WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isManager = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role || '');

    if (!isManager || user.club_id !== clubId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user exists and is not already in a club
    const targetUserQuery = `
      SELECT id, name, email, club_id FROM users WHERE email = $1
    `;
    const targetUserResult = await db.query(targetUserQuery, [email]);
    const targetUser = targetUserResult.rows[0];
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (targetUser.club_id) {
      return NextResponse.json({ error: "User is already in a club" }, { status: 400 });
    }

    // Add user to club
    const updateUserQuery = `
      UPDATE users SET club_id = $1 WHERE id = $2 
      RETURNING id, name, email, role, created_at, profile_picture
    `;
    const updatedUserResult = await db.query(updateUserQuery, [clubId, targetUser.id]);
    const updatedUser = updatedUserResult.rows[0];

    return NextResponse.json({ 
      message: "Member added successfully",
      member: updatedUser
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
