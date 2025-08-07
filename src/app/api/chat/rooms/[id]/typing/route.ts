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

// Send typing indicator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real-time system, you'd broadcast this to other users
    // For now, we'll just acknowledge it
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Stop typing indicator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real-time system, you'd stop broadcasting typing indicator
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Stop typing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
