import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
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
        error: "Access denied. Only admin and super admin users can remove committee members." 
      }, { status: 403 });
    }

    const { memberId } = params;

    // Get member details before deletion for logging
    const memberQuery = `
      SELECT 
        cm.id,
        cm.committee_id,
        c.name as committee_name,
        cm.user_id,
        u.name as user_name,
        u.email as user_email,
        cm.role
      FROM committee_members cm
      JOIN committees c ON cm.committee_id = c.id
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = $1
    `;
    const memberResult = await db.query(memberQuery, [memberId]);

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Committee member not found" 
      }, { status: 404 });
    }

    const member = memberResult.rows[0];

    // Delete the committee membership
    await db.query('DELETE FROM committee_members WHERE id = $1', [memberId]);

    return NextResponse.json({
      success: true,
      message: `Removed ${member.user_name} from ${member.committee_name}`,
      removedMember: {
        name: member.user_name,
        email: member.user_email,
        committee: member.committee_name,
        role: member.role
      }
    });

  } catch (error) {
    console.error('Error removing committee member:', error);
    return NextResponse.json({ 
      error: "Internal server error while removing committee member" 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
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
        error: "Access denied. Only admin and super admin users can update committee members." 
      }, { status: 403 });
    }

    const { memberId } = params;
    const body = await request.json();
    const { role, academic_year, is_current_term, hierarchy } = body;

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (role !== undefined) {
      updateFields.push(`role = $${valueIndex++}`);
      values.push(role);
    }

    if (academic_year !== undefined) {
      updateFields.push(`academic_year = $${valueIndex++}`);
      values.push(academic_year);
    }

    if (is_current_term !== undefined) {
      updateFields.push(`is_current_term = $${valueIndex++}`);
      values.push(is_current_term);
    }

    if (hierarchy !== undefined) {
      updateFields.push(`hierarchy = $${valueIndex++}`);
      values.push(hierarchy);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        error: "No fields to update" 
      }, { status: 400 });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(memberId);

    const updateQuery = `
      UPDATE committee_members 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Committee member not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Committee member updated successfully",
      member: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating committee member:', error);
    return NextResponse.json({ 
      error: "Internal server error while updating committee member" 
    }, { status: 500 });
  }
}