import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database-service';
import { db } from '@/lib/database-service';
import { verifyAuth } from "@/lib/AuthMiddleware";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/announcements/[id] - Get single announcement
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] - Update announcement (only by author or managers)
export async function PUT(request: NextRequest, { params }: Props) {
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

    const { id } = await params;
    const { title, content, type, priority } = await request.json();

    // Get current announcement
    const currentAnnouncement = await db.announcement.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!currentAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Check if user is author or manager
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const isManager =
      user &&
      [
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
      return NextResponse.json(
        { error: "You don't have permission to edit this announcement" },
        { status: 403 }
      );
    }

    const updatedAnnouncement = await db.announcement.update({
      where: { id },
      data: {
        title,
        content,
        priority: priority || 'normal'
      }
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Delete announcement (only by author within 3 hours or managers)
export async function DELETE(request: NextRequest, { params }: Props) {
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

    const { id } = await params;

    // Get current announcement
    const currentAnnouncement = await db.announcement.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!currentAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Check if user is manager
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    const isManager =
      user &&
      [
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
      return NextResponse.json(
        { error: "You don't have permission to delete this announcement" },
        { status: 403 }
      );
    }

    // Delete the announcement
    await db.announcement.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
