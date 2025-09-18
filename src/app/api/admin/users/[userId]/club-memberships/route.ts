import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { db } from "@/lib/database";

// GET - Get all clubs for dropdown selections
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: "Access denied. Only admin and super admin users can access club data." 
      }, { status: 403 });
    }

    // Get all clubs
    const clubsQuery = `
      SELECT 
        id,
        name,
        type,
        description
      FROM clubs
      ORDER BY name
    `;

    const result = await db.query(clubsQuery);

    return NextResponse.json({
      success: true,
      clubs: result.rows
    });

  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add club membership
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: "Access denied. Only admin and super admin users can manage memberships." 
      }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { 
      club_id, 
      role = 'member',
      academic_year, 
      is_leader = false,
      is_current_term = false,
      hierarchy = 5,
      display_order = 0,
      bio,
      achievements = []
    } = body;

    // Validate required fields
    if (!club_id || !academic_year) {
      return NextResponse.json({ 
        error: "Club ID and academic year are required" 
      }, { status: 400 });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if club exists
    const clubCheck = await db.query('SELECT id FROM clubs WHERE id = $1', [club_id]);
    if (clubCheck.rows.length === 0) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if membership already exists
    const existingMembership = await db.query(
      `SELECT id FROM club_members 
       WHERE user_id = $1 AND club_id = $2 AND academic_year = $3`,
      [userId, club_id, academic_year]
    );

    if (existingMembership.rows.length > 0) {
      return NextResponse.json({ 
        error: "User already has this club membership for this academic year" 
      }, { status: 400 });
    }

    // Insert new membership
    const insertQuery = `
      INSERT INTO club_members (
        user_id, club_id, role, academic_year, is_leader, 
        is_current_term, hierarchy, display_order, bio, achievements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      userId, club_id, role, academic_year, is_leader,
      is_current_term, hierarchy, display_order, bio || null, 
      Array.isArray(achievements) ? achievements : []
    ]);

    return NextResponse.json({
      success: true,
      message: "Club membership added successfully",
      membership_id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error adding club membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}