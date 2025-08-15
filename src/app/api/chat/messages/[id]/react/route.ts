import { NextRequest, NextResponse } from "next/server";
import PrismaDB from '@/lib/database-consolidated';
import jwt from 'jsonwebtoken';

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
  { params }: { params: Promise<{ id: string }> }
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

    // Get current message using PrismaDB
    const resolvedParams = await params;
    const message = await PrismaDB.getClient().chatMessage.findUnique({
      where: { id: resolvedParams.id },
      select: { reactions: true }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update reactions
    const currentReactions = (message.reactions as any) || {};
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

    // Update message using PrismaDB
    await PrismaDB.getClient().chatMessage.update({
      where: { id: resolvedParams.id },
      data: { reactions: currentReactions }
    });

    return NextResponse.json({ success: true, reactions: currentReactions });

  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
