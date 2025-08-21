import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/clubs/[clubId]/events - Get events for a specific club
export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { clubId } = await params;

    // Get events for the club
    const eventsQuery = `
      SELECT 
        e.*,
        COALESCE(attendee_counts.attendees_count, 0) as attendees_count,
        CASE 
          WHEN e.event_date > NOW() THEN 'upcoming'
          WHEN e.event_date::date = CURRENT_DATE THEN 'ongoing'
          ELSE 'completed'
        END as status
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) as attendees_count
        FROM event_attendees
        WHERE attendance_status IN ('registered', 'attended')
        GROUP BY event_id
      ) attendee_counts ON e.id = attendee_counts.event_id
      WHERE e.club_id = $1
      ORDER BY e.event_date DESC
      LIMIT 20
    `;

    const result = await db.query(eventsQuery, [clubId]);

    return NextResponse.json({
      success: true,
      events: result.rows
    });

  } catch (error) {
    console.error('Error fetching club events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
