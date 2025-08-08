import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { verifyAuth } from "@/lib/AuthMiddleware";



interface Props {
  params: { id: string };
}

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const { id } = await params;
    const { read } = await request.json();

    // Check if notification belongs to user
    const checkQuery = `
      SELECT id FROM notifications 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await Database.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update notification
    const updateQuery = `
      UPDATE notifications 
      SET read = $1, read_at = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;

    const result = await Database.query(updateQuery, [
      read,
      read ? new Date().toISOString() : null,
      id,
      userId,
    ]);

    return NextResponse.json({ notification: result.rows[0] });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const { id } = await params;

    // Check if notification belongs to user
    const checkQuery = `
      SELECT id FROM notifications 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await Database.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Delete notification
    await Database.query("DELETE FROM notifications WHERE id = $1", [id]);

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
