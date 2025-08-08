import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { verifyAuth } from "@/lib/AuthMiddleware";

interface Props {
  params: { id: string };
}

// GET /api/announcements/[id] - Get single announcement
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const query = `
      SELECT 
        a.*,
        u.name as author_name,
        c.name as club_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN clubs c ON a.club_id = c.id
      WHERE a.id = $1
    `;

    const result = await Database.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
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
    const currentAnnouncement = await Database.query(
      "SELECT created_by, created_at FROM announcements WHERE id = $1",
      [id]
    );

    if (currentAnnouncement.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = currentAnnouncement.rows[0];

    // Check if user is author or manager
    const user = await Database.getUserById(userId);
    const isAuthor = announcement.created_by === userId;
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

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to edit this announcement" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can edit anytime)
    if (!isManager) {
      const createdAt = new Date(announcement.created_at);
      const now = new Date();
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          {
            error: "You can only edit announcements within 3 hours of creation",
          },
          { status: 403 }
        );
      }
    }

    const query = `
      UPDATE announcements 
      SET title = $1, content = $2, type = $3, priority = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await Database.query(query, [
      title,
      content,
      type,
      priority,
      id,
    ]);

    return NextResponse.json(result.rows[0]);
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
    const currentAnnouncement = await Database.query(
      "SELECT created_by, created_at FROM announcements WHERE id = $1",
      [id]
    );

    if (currentAnnouncement.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = currentAnnouncement.rows[0];

    // Check if user is author or manager
    const user = await Database.getUserById(userId);
    const isAuthor = announcement.created_by === userId;
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

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to delete this announcement" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can delete anytime)
    if (!isManager) {
      const createdAt = new Date(announcement.created_at);
      const now = new Date();
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          {
            error:
              "You can only delete announcements within 3 hours of creation",
          },
          { status: 403 }
        );
      }
    }

    // Delete the announcement
    await Database.query("DELETE FROM announcements WHERE id = $1", [id]);

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
