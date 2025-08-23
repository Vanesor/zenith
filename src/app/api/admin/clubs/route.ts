import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication and role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Check if user has admin access
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

    // Only Zenith committee members and system admins can access this endpoint
    if (!isZenithCommittee && !isSystemAdmin) {
      return NextResponse.json({ 
        error: "Access denied. Only Zenith committee members can access this resource." 
      }, { status: 403 });
    }

    // Get comprehensive club data with stats
    const clubsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        c.logo_url,
        c.banner_image_url,
        c.type,
        c.icon,
        c.color,
        c.member_count,
        COUNT(DISTINCT u.id) as member_count_actual,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT a.id) as assignment_count,
        coord.id as coordinator_id,
        coord.name as coordinator_name,
        coord.email as coordinator_email
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id 
      LEFT JOIN posts p ON c.id = p.club_id
      LEFT JOIN assignments a ON c.id = a.club_id
      LEFT JOIN users coord ON c.id = coord.club_id 
        AND coord.role IN ('coordinator', 'club_coordinator')
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at, 
               c.logo_url, c.banner_image_url, c.type, c.icon, c.color, 
               c.member_count, coord.id, coord.name, coord.email
      ORDER BY c.created_at DESC
    `;

    const clubsResult = await db.query(clubsQuery);
    const clubs = clubsResult.rows.map((club: any) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      type: club.type,
      color: club.color,
      status: club.member_count_actual > 0 ? "active" : "inactive", // Determine status based on members
      member_count: parseInt(club.member_count_actual) || 0,
      coordinator_id: club.coordinator_id,
      coordinator_name: club.coordinator_name || 'TBA',
      coordinator_email: club.coordinator_email,
      created_at: club.created_at,
      updated_at: club.updated_at || club.created_at,
      event_count: parseInt(club.event_count) || 0,
      post_count: parseInt(club.post_count) || 0,
      assignment_count: parseInt(club.assignment_count) || 0
    }));

    // Get system-wide stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM clubs WHERE id IN (
          SELECT DISTINCT club_id FROM users WHERE club_id IS NOT NULL
        )) as active_clubs,
        (SELECT COUNT(*) FROM users WHERE club_id IS NOT NULL) as total_members,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as total_events,
        (SELECT COUNT(*) FROM assignments) as total_assignments
    `;

    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get all club members for admin management
    const membersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.club_id,
        c.name as club_name,
        u.created_at as joined_at,
        u.avatar_url as avatar
      FROM users u
      LEFT JOIN clubs c ON u.club_id = c.id
      WHERE u.club_id IS NOT NULL
      ORDER BY c.name, u.name
    `;

    const membersResult = await db.query(membersQuery);
    const members = membersResult.rows;

    console.log(`📊 Admin: Found ${clubs.length} clubs, ${members.length} members`);

    return NextResponse.json({
      success: true,
      clubs,
      members,
      stats: {
        totalClubs: parseInt(stats.total_clubs) || 0,
        activeClubs: parseInt(stats.active_clubs) || 0,
        pendingClubs: 0, // We don't have pending status yet
        totalMembers: parseInt(stats.total_members) || 0,
        totalEvents: parseInt(stats.total_events) || 0,
        totalAssignments: parseInt(stats.total_assignments) || 0
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch admin clubs data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication and role
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Check if user has admin access
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

    // Only Zenith committee members and system admins can create clubs
    if (!isZenithCommittee && !isSystemAdmin) {
      return NextResponse.json({ 
        error: "Access denied. Only Zenith committee members can create clubs." 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, color } = body;

    // Validate required fields
    if (!name || !description || !type) {
      return NextResponse.json({ 
        error: "Missing required fields: name, description, type" 
      }, { status: 400 });
    }

    // Create new club
    const createClubQuery = `
      INSERT INTO clubs (name, description, type, color, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;

    const clubResult = await db.query(createClubQuery, [
      name,
      description,
      type,
      color || '#3B82F6' // Default blue color
    ]);

    const newClub = clubResult.rows[0];

    console.log(`✅ Admin: Created new club ${newClub.name} (ID: ${newClub.id})`);

    return NextResponse.json({
      success: true,
      club: {
        id: newClub.id,
        name: newClub.name,
        description: newClub.description,
        type: newClub.type,
        color: newClub.color,
        status: "inactive", // New clubs start as inactive
        member_count: 0,
        coordinator_id: null,
        coordinator_name: 'TBA',
        created_at: newClub.created_at,
        updated_at: newClub.updated_at
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to create club" },
      { status: 500 }
    );
  }
}
