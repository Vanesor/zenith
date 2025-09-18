import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Ensure user is a system admin
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: "Access denied. Only admin and super admin users can access this endpoint." 
      }, { status: 403 });
    }

    // Fetch all data needed for comprehensive admin dashboard
    
    // 1. Get all users
    const usersQuery = `
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at, 
        last_login,
        CASE 
          WHEN last_login > NOW() - INTERVAL '30 days' THEN 'active'
          ELSE 'inactive'
        END as status,
        avatar,
        profile_image_url,
        year,
        branch
      FROM users 
      ORDER BY created_at DESC
    `;
    const usersResult = await db.query(usersQuery);

    // 2. Get all clubs
    const clubsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.type,
        c.color,
        c.member_count,
        c.created_at,
        c.updated_at,
        (
          SELECT json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          )
          FROM club_members cm 
          JOIN users u ON cm.user_id = u.id
          WHERE cm.club_id = c.id 
          AND cm.role = 'coordinator'
          AND cm.is_current_term = true
          LIMIT 1
        ) as coordinator
      FROM clubs c
      ORDER BY c.name ASC
    `;
    const clubsResult = await db.query(clubsQuery);

    // 3. Get all committees
    const committeesQuery = `
      SELECT 
        id,
        name,
        description,
        is_active,
        created_at
      FROM committees
      ORDER BY name ASC
    `;
    const committeesResult = await db.query(committeesQuery);

    // 4. Get all club members with club names
    const clubMembersQuery = `
      SELECT 
        cm.id,
        cm.club_id,
        c.name as club_name,
        cm.user_id,
        u.name,
        u.email,
        cm.role,
        cm.hierarchy,
        cm.is_current_term,
        cm.joined_at,
        cm.academic_year,
        u.avatar,
        u.profile_image_url
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      JOIN clubs c ON cm.club_id = c.id
      ORDER BY c.name ASC, cm.hierarchy ASC, u.name ASC
    `;
    const clubMembersResult = await db.query(clubMembersQuery);

    // 5. Get all committee members with committee names
    const committeeMembersQuery = `
      SELECT 
        cm.id,
        cm.committee_id,
        c.name as committee_name,
        cm.user_id,
        u.name,
        u.email,
        cm.role,
        cm.hierarchy,
        cm.is_current_term,
        cm.joined_at,
        cm.academic_year,
        u.avatar,
        u.profile_image_url
      FROM committee_members cm
      JOIN users u ON cm.user_id = u.id
      JOIN committees c ON cm.committee_id = c.id
      ORDER BY c.name ASC, cm.hierarchy ASC, u.name ASC
    `;
    const committeeMembersResult = await db.query(committeeMembersQuery);

    // 6. Get system statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM committees WHERE is_active = true) as total_committees,
        (
          SELECT COUNT(*) 
          FROM (
            SELECT user_id FROM club_members WHERE is_current_term = true
            UNION
            SELECT user_id FROM committee_members WHERE is_current_term = true
          ) as active_members
        ) as active_members
    `;
    const statsResult = await db.query(statsQuery);

    const response = {
      success: true,
      users: usersResult.rows,
      clubs: clubsResult.rows,
      committees: committeesResult.rows,
      clubMembers: clubMembersResult.rows,
      committeeMembers: committeeMembersResult.rows,
      stats: statsResult.rows[0] || {
        total_users: 0,
        total_clubs: 0,
        total_committees: 0,
        active_members: 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching comprehensive admin data:', error);
    return NextResponse.json({ 
      error: "Internal server error while fetching admin data" 
    }, { status: 500 });
  }
}