import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: Promise<{ clubId: string }>;
}

// GET /api/clubs/[clubId]/members - Get club members
export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Connect to Prisma if not already connected
    await db.$connect();
    
    const { clubId } = await params;

    // Get club members
    const members = await db.users.findMany({
      where: { club_id: clubId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching club members:", error);
    return NextResponse.json(
      { error: "Failed to fetch club members" },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[clubId]/members - Add member to club
export async function POST(request: NextRequest, { params }: Props) {
  try {
    // Connect to Prisma if not already connected
    await db.$connect();
    
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
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { role: true, club_id: true }
    });
    
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
    const targetUser = await db.users.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, club_id: true }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (targetUser.club_id) {
      return NextResponse.json({ error: "User is already in a club" }, { status: 400 });
    }

    // Add user to club
    const updatedUser = await db.users.update({
      where: { id: targetUser.id },
      data: { club_id: clubId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        avatar: true
      }
    });

    return NextResponse.json({ 
      message: "Member added successfully",
      member: updatedUser
    });
  } catch (error) {
    console.error("Error adding club member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
