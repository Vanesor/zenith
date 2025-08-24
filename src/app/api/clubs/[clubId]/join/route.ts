import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// POST /api/clubs/[clubId]/join - Join a club
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clubId } = await params;
    const userId = authResult.user.id;

    // Check if user is already in a club
    const userResult = await db.query(
      'SELECT club_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentClubId = userResult.rows[0].club_id;
    if (currentClubId) {
      return NextResponse.json(
        { error: 'You are already a member of a club. Leave your current club first to join another.' },
        { status: 400 }
      );
    }

    // Check if club exists
    const clubResult = await db.query(
      'SELECT id, name FROM clubs WHERE id = $1',
      [clubId]
    );

    if (clubResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Join the club
    await db.query(
      'UPDATE users SET club_id = $1, updated_at = NOW() WHERE id = $2',
      [clubId, userId]
    );

    // Create a user activity log entry
    await db.query(
      `INSERT INTO user_activities (
        user_id, action, target_type, target_id, target_name, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId,
        'joined',
        'club',
        clubId,
        clubResult.rows[0].name,
        JSON.stringify({ message: `${authResult.user.name} joined the club` })
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${clubResult.rows[0].name}`
    });

  } catch (error) {
    console.error('Error joining club:', error);
    return NextResponse.json(
      { error: 'Failed to join club' },
      { status: 500 }
    );
  }
}
