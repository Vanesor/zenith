import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { db } from "@/lib/database";

// PUT - Update committee membership
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
      committee_id, 
      role_id, 
      academic_year, 
      status,
      is_current_term,
      term_start,
      term_end 
    } = body;

    // Check if membership exists and belongs to the user
    const membershipCheck = await db.query(
      'SELECT id FROM committee_members WHERE id = $1 AND user_id = $2',
      [membershipId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: "Committee membership not found" 
      }, { status: 404 });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (committee_id !== undefined) {
      updateFields.push(`committee_id = $${valueIndex++}`);
      values.push(committee_id);
    }
    if (role_id !== undefined) {
      updateFields.push(`role_id = $${valueIndex++}`);
      values.push(role_id);
    }
    if (academic_year !== undefined) {
      updateFields.push(`academic_year = $${valueIndex++}`);
      values.push(academic_year);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    if (is_current_term !== undefined) {
      updateFields.push(`is_current_term = $${valueIndex++}`);
      values.push(is_current_term);
    }
    if (term_start !== undefined) {
      updateFields.push(`term_start = $${valueIndex++}`);
      values.push(term_start);
    }
    if (term_end !== undefined) {
      updateFields.push(`term_end = $${valueIndex++}`);
      values.push(term_end);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        error: "No fields to update" 
      }, { status: 400 });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(membershipId);

    const updateQuery = `
      UPDATE committee_members 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id
    `;

    const result = await db.query(updateQuery, values);

    return NextResponse.json({
      success: true,
      message: "Committee membership updated successfully"
    });

  } catch (error) {
    console.error('Error updating committee membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove committee membership
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
      'SELECT id FROM committee_members WHERE id = $1 AND user_id = $2',
      [membershipId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: "Committee membership not found" 
      }, { status: 404 });
    }

    // Delete the membership
    await db.query('DELETE FROM committee_members WHERE id = $1', [membershipId]);

    return NextResponse.json({
      success: true,
      message: "Committee membership removed successfully"
    });

  } catch (error) {
    console.error('Error removing committee membership:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}