import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/announcements/[id] - Get single announcement
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const result = await db.query(`
      SELECT * FROM announcements 
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const announcement = result.rows[0];

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
    const currentResult = await db.query(`
      SELECT id, author_id FROM announcements 
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const currentAnnouncement = currentResult.rows[0];

    // Check if user is manager
    const userResult = await db.query(`
      SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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

    if (!isManager) {
      return NextResponse.json(
        { error: "You don't have permission to edit this announcement" },
        { status: 403 }
      );
    }

    const updateResult = await db.query(`
      UPDATE announcements 
      SET title = $1, content = $2, priority = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING *
    `, [title, content, priority || 'normal', id]);

    const updatedAnnouncement = updateResult.rows[0];

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
    const currentResult = await db.query(`
      SELECT id FROM announcements 
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Check if user is manager
    const userDeleteResult = await db.query(`
      SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL
    `, [userId]);
    
    const user = userDeleteResult.rows[0];
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
    await db.query(`
      DELETE FROM announcements WHERE id = $1
    `, [id]);

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
