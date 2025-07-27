import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: { clubId: string };
}

// POST /api/clubs/[clubId]/members - Add member to club
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { clubId } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user is a manager of this club
    const userQuery = `
      SELECT role, club_id FROM users WHERE id = $1
    `;
    const userResult = await Database.query(userQuery, [userId]);
    
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

    // Check if user exists and is not already in a club
    const targetUserQuery = `
      SELECT id, name, email, club_id FROM users WHERE email = $1
    `;
    const targetUserResult = await Database.query(targetUserQuery, [email]);
    
    if (targetUserResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = targetUserResult.rows[0];
    
    if (targetUser.club_id) {
      return NextResponse.json({ error: "User is already in a club" }, { status: 400 });
    }

    // Add user to club
    const updateQuery = `
      UPDATE users SET club_id = $1 WHERE id = $2
      RETURNING id, name, email, role, created_at as joined_at, avatar
    `;
    const updateResult = await Database.query(updateQuery, [clubId, targetUser.id]);

    return NextResponse.json({ 
      message: "Member added successfully",
      member: updateResult.rows[0]
    });
  } catch (error) {
    console.error("Error adding club member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
