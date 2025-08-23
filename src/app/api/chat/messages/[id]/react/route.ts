import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

// Add reaction to message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Get current message using SQL
    const resolvedParams = await params;
    const messageResult = await db.query(
      'SELECT id, reactions FROM chat_messages WHERE id = $1',
      [resolvedParams.id]
    );

    if (messageResult.rows.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = messageResult.rows[0];

    // Update reactions
    const currentReactions = message.reactions || {};
    if (!currentReactions[emoji]) {
      currentReactions[emoji] = [];
    }

    // Toggle reaction
    const userIndex = currentReactions[emoji].indexOf(authResult.user.id);
    if (userIndex > -1) {
      currentReactions[emoji].splice(userIndex, 1);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    } else {
      currentReactions[emoji].push(authResult.user.id);
    }

    // Update message using SQL
    await db.query(
      'UPDATE chat_messages SET reactions = $1 WHERE id = $2',
      [JSON.stringify(currentReactions), resolvedParams.id]
    );

    return NextResponse.json({ success: true, reactions: currentReactions });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
