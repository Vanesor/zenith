import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Add reaction to message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Get current message
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('reactions')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update reactions
    const currentReactions = message.reactions || {};
    if (!currentReactions[emoji]) {
      currentReactions[emoji] = [];
    }

    // Toggle reaction
    const userIndex = currentReactions[emoji].indexOf(user.userId);
    if (userIndex > -1) {
      currentReactions[emoji].splice(userIndex, 1);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    } else {
      currentReactions[emoji].push(user.userId);
    }

    // Update message
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ reactions: currentReactions })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reactions: currentReactions });

  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
