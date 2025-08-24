import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';

// GET - Fetch available events for featuring
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user?.role?.toLowerCase() || '';

    // Enhanced role checking for admin access
    const isZenithCommittee = [
      'president',
      'vice_president', 
      'innovation_head',
      'secretary',
      'treasurer',
      'outreach_coordinator',
      'media_coordinator',
      'zenith_committee'
    ].includes(userRole);
    const isSystemAdmin = userRole === 'admin';
    const isClubCoordinator = [
      'coordinator',
      'co_coordinator',
      'club_coordinator',
      'co-coordinator'
    ].includes(userRole);

    const hasAccess = isZenithCommittee || isSystemAdmin || isClubCoordinator;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('club_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query based on permissions
    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.location,
        e.start_date,
        e.end_date,
        e.image_url,
        e.club_id,
        c.name as club_name,
        e.created_at
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      WHERE e.start_date >= CURRENT_DATE
    `;
    const params: any[] = [];

    // If user is club coordinator, only show their club's events
    if (isClubCoordinator && !isZenithCommittee && !isSystemAdmin) {
      query += ` AND e.club_id = $${params.length + 1}`;
      params.push(user?.club_id);
    }

    // If specific club requested and user has access
    if (clubId && (isZenithCommittee || isSystemAdmin || user?.club_id === clubId)) {
      query += ` AND e.club_id = $${params.length + 1}`;
      params.push(clubId);
    }

    query += ` ORDER BY e.start_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      events: result.rows || [],
      total: result.rowCount || 0
    });

  } catch (error) {
    console.error('Error fetching available events:', error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
