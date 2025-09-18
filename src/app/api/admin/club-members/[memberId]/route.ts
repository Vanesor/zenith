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
        error: "Access denied. Only admin and super admin users can remove club members." 
      }, { status: 403 });
    }

    const { memberId } = params;

    // Get member details before deletion for logging
    const memberQuery = `
      SELECT 
        cm.id,
        cm.club_id,
        c.name as club_name,
        cm.user_id,
        u.name as user_name,
        u.email as user_email,
        cm.role
      FROM club_members cm
      JOIN clubs c ON cm.club_id = c.id
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = $1
    `;
    const memberResult = await db.query(memberQuery, [memberId]);

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Club member not found" 
      }, { status: 404 });
    }

    const member = memberResult.rows[0];

    // Start transaction
    await db.query('BEGIN');

    try {
      // Delete the club membership
      await db.query('DELETE FROM club_members WHERE id = $1', [memberId]);

      // Update club member count
      await db.query(`
        UPDATE clubs 
        SET member_count = (
          SELECT COUNT(*) 
          FROM club_members 
          WHERE club_id = $1 AND is_current_term = true
        )
        WHERE id = $1
      `, [member.club_id]);

      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Removed ${member.user_name} from ${member.club_name}`,
        removedMember: {
          name: member.user_name,
          email: member.user_email,
          club: member.club_name,
          role: member.role
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error removing club member:', error);
    return NextResponse.json({ 
      error: "Internal server error while removing club member" 
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
        error: "Access denied. Only admin and super admin users can update club members." 
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
      UPDATE club_members 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Club member not found" 
      }, { status: 404 });
    }

    // If is_current_term was updated, update club member count
    if (is_current_term !== undefined) {
      const clubId = result.rows[0].club_id;
      await db.query(`
        UPDATE clubs 
        SET member_count = (
          SELECT COUNT(*) 
          FROM club_members 
          WHERE club_id = $1 AND is_current_term = true
        )
        WHERE id = $1
      `, [clubId]);
    }

    return NextResponse.json({
      success: true,
      message: "Club member updated successfully",
      member: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating club member:', error);
    return NextResponse.json({ 
      error: "Internal server error while updating club member" 
    }, { status: 500 });
  }
}