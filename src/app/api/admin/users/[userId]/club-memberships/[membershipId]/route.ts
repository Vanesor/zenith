import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { db } from "@/lib/database";

// PUT - Update club membership
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; membershipId: string } }
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

    const { userId, membershipId } = params;
    const body = await request.json();
    const { 
      club_id, 
      role, 
      academic_year, 
      is_leader,
      is_current_term,
      hierarchy,
      display_order,
      bio,
      achievements 
    } = body;

    // Check if membership exists and belongs to the user
    const membershipCheck = await db.query(
      'SELECT id FROM club_members WHERE id = $1 AND user_id = $2',
      [membershipId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: "Club membership not found" 
      }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (club_id !== undefined) {
      updateFields.push(`club_id = $${valueIndex++}`);
      values.push(club_id);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${valueIndex++}`);
      values.push(role);
    }
    if (academic_year !== undefined) {
      updateFields.push(`academic_year = $${valueIndex++}`);
      values.push(academic_year);
    }
    if (is_leader !== undefined) {
      updateFields.push(`is_leader = $${valueIndex++}`);
      values.push(is_leader);
    }
    if (is_current_term !== undefined) {
      updateFields.push(`is_current_term = $${valueIndex++}`);
      values.push(is_current_term);
    }
    if (hierarchy !== undefined) {
      updateFields.push(`hierarchy = $${valueIndex++}`);
      values.push(hierarchy);
    }
    if (display_order !== undefined) {
      updateFields.push(`display_order = $${valueIndex++}`);
      values.push(display_order);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${valueIndex++}`);
      values.push(bio);
    }
    if (achievements !== undefined) {
      updateFields.push(`achievements = $${valueIndex++}`);
      values.push(Array.isArray(achievements) ? achievements : []);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        error: "No fields to update" 
      }, { status: 400 });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(membershipId);

    const updateQuery = `
      UPDATE club_members 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id
    `;

    const result = await db.query(updateQuery, values);

    return NextResponse.json({
      success: true,
      message: "Club membership updated successfully"
    });

  } catch (error) {
    console.error('Error updating club membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove club membership
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; membershipId: string } }
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

    const { userId, membershipId } = params;

    // Check if membership exists and belongs to the user
    const membershipCheck = await db.query(
      'SELECT id FROM club_members WHERE id = $1 AND user_id = $2',
      [membershipId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: "Club membership not found" 
      }, { status: 404 });
    }

    // Delete the membership
    await db.query('DELETE FROM club_members WHERE id = $1', [membershipId]);

    return NextResponse.json({
      success: true,
      message: "Club membership removed successfully"
    });

  } catch (error) {
    console.error('Error removing club membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}