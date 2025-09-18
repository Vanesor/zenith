import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { db } from "@/lib/database";

// GET - Get all committees and roles for dropdown selections
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
        error: "Access denied. Only admin and super admin users can access committee data." 
      }, { status: 403 });
    }

    // Get all committees with their roles
    const committeesQuery = `
      SELECT 
        c.id as committee_id,
        c.name as committee_name,
        c.description,
        cr.id as role_id,
        cr.name as role_name,
        cr.hierarchy,
        cr.description as role_description
      FROM committees c
      LEFT JOIN committee_roles cr ON c.id = cr.committee_id
      WHERE c.is_active = true
      ORDER BY c.name, cr.hierarchy
    `;

    const result = await db.query(committeesQuery);
    
    // Group roles by committee
    const committees = result.rows.reduce((acc: any, row) => {
      const committeeId = row.committee_id;
      
      if (!acc[committeeId]) {
        acc[committeeId] = {
          id: committeeId,
          name: row.committee_name,
          description: row.description,
          roles: []
        };
      }
      
      if (row.role_id) {
        acc[committeeId].roles.push({
          id: row.role_id,
          name: row.role_name,
          hierarchy: row.hierarchy,
          description: row.role_description
        });
      }
      
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      committees: Object.values(committees)
    });

  } catch (error) {
    console.error('Error fetching committees:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add committee membership
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
      committee_id, 
      role_id, 
      academic_year, 
      status = 'active',
      is_current_term = false,
      term_start,
      term_end 
    } = body;

    // Validate required fields
    if (!committee_id || !role_id || !academic_year) {
      return NextResponse.json({ 
        error: "Committee ID, role ID, and academic year are required" 
      }, { status: 400 });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if membership already exists
    const existingMembership = await db.query(
      `SELECT id FROM committee_members 
       WHERE user_id = $1 AND committee_id = $2 AND role_id = $3 AND academic_year = $4`,
      [userId, committee_id, role_id, academic_year]
    );

    if (existingMembership.rows.length > 0) {
      return NextResponse.json({ 
        error: "User already has this committee membership for this academic year" 
      }, { status: 400 });
    }

    // Insert new membership
    const insertQuery = `
      INSERT INTO committee_members (
        user_id, committee_id, role_id, academic_year, status, 
        is_current_term, term_start, term_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      userId, committee_id, role_id, academic_year, status,
      is_current_term, term_start || null, term_end || null
    ]);

    return NextResponse.json({
      success: true,
      message: "Committee membership added successfully",
      membership_id: result.rows[0].id
    });

  } catch (error) {
    console.error('Error adding committee membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}