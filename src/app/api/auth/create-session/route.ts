import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { randomUUID } from 'crypto';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    console.log("Starting session creation");
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      console.log("Authentication failed:", authResult.error);
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;
    
    // Check if user already has an active session
    const existingSession = await db.query(
      'SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (existingSession.rows.length > 0) {
      console.log(`Found existing session for user ${userId}`);
      return NextResponse.json({
        success: true,
        session: {
          id: existingSession.rows[0].id,
          expiresAt: existingSession.rows[0].expires_at
        }
      });
    }
    
    // Create a new session
    const sessionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Insert session into database using the correct column names
    await db.query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at, last_active_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [sessionId, userId, sessionId, expiresAt, now, now]
    );
    
    console.log(`Created new session ${sessionId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        expiresAt
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
