import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { verifyAuth } from "@/lib/AuthMiddleware";

// PUT /api/chat/rooms/[id] - Update room name (managers only)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // In Next.js 13+, params needs to be accessed from context
  const { id } = context.params;
  console.log('PUT /api/chat/rooms/[id] called with ID:', id);
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Check if user is a manager and owns the room
    const roomQuery = `
      SELECT cr.*, u.role, u.club_id 
      FROM chat_rooms cr
      JOIN users u ON u.id = $1
      WHERE cr.id = $2
    `;
    const roomResult = await Database.query(roomQuery, [userId, id]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];
    const user = roomResult.rows[0];

    // Check if user is a manager
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

    if (!isManager || room.created_by !== userId) {
      return NextResponse.json(
        { error: "Only the room creator can rename this room" },
        { status: 403 }
      );
    }

    // Check for duplicate room names within the same club
    const duplicateQuery = `
      SELECT id FROM chat_rooms 
      WHERE LOWER(name) = LOWER($1) AND club_id = $2 AND id != $3
    `;
    const duplicateResult = await Database.query(duplicateQuery, [
      name.trim(),
      user.club_id,
      id,
    ]);

    if (duplicateResult.rows.length > 0) {
      return NextResponse.json(
        { error: "A room with this name already exists in your club" },
        { status: 409 }
      );
    }

    // Update the room name
    const updateQuery = `
      UPDATE chat_rooms 
      SET name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await Database.query(updateQuery, [name.trim(), id]);

    return NextResponse.json({
      message: "Room renamed successfully",
      room: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/rooms/[id] - Delete room (managers only)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // In Next.js 13+, params needs to be accessed from context
  const { id } = await context.params;
  console.log('DELETE /api/chat/rooms/[id] called with ID:', id);
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

    // Check if user is a manager and owns the room
    const roomQuery = `
      SELECT cr.*, u.role 
      FROM chat_rooms cr
      JOIN users u ON u.id = $1
      WHERE cr.id = $2
    `;
    const roomResult = await Database.query(roomQuery, [userId, id]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomResult.rows[0];
    const user = roomResult.rows[0];

    // Check if user is a manager
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

    if (!isManager || room.created_by !== userId) {
      return NextResponse.json(
        { error: "Only the room creator can delete this room" },
        { status: 403 }
      );
    }

    // Delete associated messages first (if chat_messages table exists)
    try {
      await Database.query("DELETE FROM chat_messages WHERE room_id = $1", [id]);
    } catch (error) {
      console.log("No chat_messages table or no messages to delete");
    }

    // Delete the room
    const deleteQuery = "DELETE FROM chat_rooms WHERE id = $1";
    await Database.query(deleteQuery, [id]);

    return NextResponse.json({
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
