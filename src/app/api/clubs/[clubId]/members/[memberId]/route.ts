import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from '@/lib/auth-unified';

interface Props {
  params: Promise<{ clubId: string; memberId: string }>;
}

// DELETE /api/clubs/[clubId]/members/[memberId] - Remove member from club
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;

    const { clubId, memberId } = await params;

    // Check if user is a manager of this club
    const userQuery = `
      SELECT role, club_id FROM users WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
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
    ].includes(user.role);

    if (!isManager || user.club_id !== clubId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if target member exists and is in this club
    const memberQuery = `
      SELECT id, role, club_id FROM users WHERE id = $1
    `;
    const memberResult = await db.query(memberQuery, [memberId]);

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const member = memberResult.rows[0];

    if (member.club_id !== clubId) {
      return NextResponse.json(
        { error: "Member not in this club" },
        { status: 400 }
      );
    }

    // Don't allow removing management positions
    const managementRoles = [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ];

    if (managementRoles.includes(member.role)) {
      return NextResponse.json(
        {
          error: "Cannot remove management positions",
        },
        { status: 400 }
      );
    }

    // Remove user from club
    const updateQuery = `
      UPDATE users SET club_id = NULL WHERE id = $1
    `;
    await db.query(updateQuery, [memberId]);

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
