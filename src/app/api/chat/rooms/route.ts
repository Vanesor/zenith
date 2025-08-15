import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

// GET /api/chat/rooms - Get all chat rooms or by club
export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Get user info to determine accessible rooms using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { club_id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("club_id") || user.club_id;

    // Use Prisma directly to avoid UUID casting issues
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { type: "public" },
          { club_id: clubId },
          { created_by: userId }
        ]
      },
      include: {
        club: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { type: 'desc' },
        { name: 'asc' }
      ]
    });

    // Transform the data to match expected format
    const transformedRooms = rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      club_id: room.club_id,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      members: room.members,
      club_name: room.club?.name || null,
      creator_name: room.creator?.name || null,
      members_count: Array.isArray(room.members) ? room.members.length : 0
    }));
    
    return NextResponse.json({ rooms: transformedRooms });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms - Create new chat room (management only)
export async function POST(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    const { name, description, type = "club" } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Get user info using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { club_id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check for duplicate room names within the same club
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        club_id: user.club_id
      }
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "A room with this name already exists in your club" },
        { status: 409 }
      );
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
    ].includes(user.role);

    if (!isManager) {
      return NextResponse.json({ 
        error: "Only management positions can create chat rooms" 
      }, { status: 403 });
    }

    // Create room using Prisma
    const room = await prisma.chatRoom.create({
      data: {
        name: name.trim(),
        description: description || '',
        club_id: user.club_id,
        type: type,
        created_by: userId,
        members: []
      },
      include: {
        club: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Transform to match expected format
    const transformedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      club_id: room.club_id,
      type: room.type,
      created_by: room.created_by,
      created_at: room.created_at,
      updated_at: room.updated_at,
      members: room.members,
      club_name: room.club?.name || null,
      creator_name: room.creator?.name || null,
      members_count: Array.isArray(room.members) ? room.members.length : 0
    };

    return NextResponse.json({ 
      message: "Chat room created successfully",
      room: transformedRoom 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 }
    );
  }
}
