import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/chat/messages/[id] - Update a message (for backward compatibility)
// PUT /api/chat/messages/[id] - Update a message (enhanced version)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const { content, is_encrypted } = await request.json();
    const userId = request.headers.get('x-user-id') || '1'; // Mock user ID

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existingMessage.user_id !== userId) {
      return NextResponse.json({ 
        error: "Unauthorized to edit this message" 
      }, { status: 403 });
    }

    // Update the message content and mark as edited
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({
        message: content, // Use 'message' field from existing schema
        is_encrypted: is_encrypted || false,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Message update error:', updateError);
      return NextResponse.json({ 
        error: "Failed to update message" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully'
    });

  } catch (error) {
    console.error("Error updating chat message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
// DELETE /api/chat/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const userId = request.headers.get('x-user-id') || '1'; // Mock user ID

    // Verify the message belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existingMessage.user_id !== userId) {
      return NextResponse.json({ 
        error: "Unauthorized to delete this message" 
      }, { status: 403 });
    }

    // Delete message (this will cascade delete attachments if properly configured)
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('Message delete error:', deleteError);
      return NextResponse.json({ 
        error: "Failed to delete message" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error("Error deleting chat message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
