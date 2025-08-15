import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database-consolidated";
import { verifyAuth, AuthenticatedRequest } from "@/lib/AuthMiddleware";

// GET /api/chat/rooms/[id]/messages - Get messages for a specific room
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify authentication using the AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Verify user has access to this room using Prisma
    const room = await prisma.chatRoom.findFirst({
      where: { id: roomId },
      include: {
        creator: {
          select: { id: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get user info to check access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { club_id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user has access to the room
    const hasAccess = 
      room.type === 'public' || 
      room.club_id === user.club_id || 
      room.created_by === userId ||
      (room.members && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages for the room using Prisma
    const messages = await prisma.chatMessage.findMany({
      where: { room_id: roomId },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            avatar: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform messages to match expected format
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      room_id: msg.room_id,
      user_id: msg.user_id,
      message: msg.message,
      message_type: msg.message_type,
      file_url: msg.file_url,
      created_at: msg.created_at,
      reply_to_message_id: msg.reply_to_message_id,
      is_edited: msg.is_edited,
      updated_at: msg.updated_at,
      attachments: msg.attachments,
      message_images: msg.message_images,
      reactions: msg.reactions,
      author_name: msg.user?.name,
      author_role: msg.user?.role,
      author_avatar: msg.user?.avatar
    }));

    return NextResponse.json({ 
      success: true,
      messages: transformedMessages.reverse() 
    });

  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms/[id]/messages - Send a message to a specific room
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;

    // Verify authentication using the AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { content, message_type, file_url } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this room using Prisma
    const room = await prisma.chatRoom.findFirst({
      where: { id: roomId },
      include: {
        creator: {
          select: { id: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get user info to check access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { club_id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user has access to the room
    const hasAccess = 
      room.type === 'public' || 
      room.club_id === user.club_id || 
      room.created_by === userId ||
      (room.members && room.members.includes(userId));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Insert the message using Prisma
    const message = await prisma.chatMessage.create({
      data: {
        room_id: roomId,
        user_id: userId,
        message: content.trim(),
        message_type: message_type || "text",
        file_url: file_url || null,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    // Transform message to match expected format
    const transformedMessage = {
      id: message.id,
      room_id: message.room_id,
      user_id: message.user_id,
      message: message.message,
      message_type: message.message_type,
      file_url: message.file_url,
      created_at: message.created_at,
      reply_to_message_id: message.reply_to_message_id,
      is_edited: message.is_edited,
      updated_at: message.updated_at,
      attachments: message.attachments,
      message_images: message.message_images,
      reactions: message.reactions,
      author_name: message.user?.name,
      author_role: message.user?.role,
      author_avatar: message.user?.avatar
    };

    return NextResponse.json({ 
      success: true,
      message: transformedMessage 
    }, { status: 201 });

  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PUT /api/chat/rooms/[id]/messages - Edit a message
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;

    // Verify authentication using the AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { messageId, content } = await request.json();

    if (!messageId || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Verify user owns the message and has access to the room using Prisma
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        room_id: roomId
      },
      include: {
        room: {
          select: {
            type: true,
            club_id: true,
            created_by: true
          }
        },
        user: {
          select: {
            club_id: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user owns the message
    if (message.user_id !== userId) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    // Update the message using Prisma
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        message: content.trim(),
        is_edited: true,
        updated_at: new Date()
      }
    });

    if (!updatedMessage) {
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: updatedMessage 
    });

  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/rooms/[id]/messages - Delete a message
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: roomId } = await params;

    // Verify authentication using the AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the message and has access to the room using Prisma
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        room_id: roomId
      },
      include: {
        room: {
          select: {
            type: true,
            club_id: true,
            created_by: true
          }
        },
        user: {
          select: {
            club_id: true,
            role: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user owns the message or is a manager/admin
    const isOwner = message.user_id === userId;
    const isManager = [
      "coordinator", "co_coordinator", "secretary", "media", "president", 
      "vice_president", "innovation_head", "treasurer", "outreach"
    ].includes(message.user?.role || '');

    if (!isOwner && !isManager) {
      return NextResponse.json({ 
        error: "You can only delete your own messages or you need manager permissions" 
      }, { status: 403 });
    }

    // Delete the message using Prisma
    const deletedMessage = await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    if (!deletedMessage) {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      messageId: deletedMessage.id
    });

  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
