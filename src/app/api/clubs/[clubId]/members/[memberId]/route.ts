import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: Promise<{ clubId: string; memberId: string }>;
}

// DELETE /api/clubs/[clubId]/members/[memberId] - Remove member from club
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

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
    console.error("Error removing club member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
