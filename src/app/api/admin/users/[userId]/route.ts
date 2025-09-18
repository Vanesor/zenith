import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
        error: "Access denied. Only admin and super admin users can modify user data." 
      }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { name, email, role, year, branch } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        error: "Name and email are required" 
      }, { status: 400 });
    }

    // Validate name has at least two words
    const nameParts = name.trim().split(' ').filter((part: string) => part.length > 0);
    if (nameParts.length < 2) {
      return NextResponse.json({ 
        error: "Name must contain at least two words (first and last name)" 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Please enter a valid email address" 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const emailCheckQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND id != $2
    `;
    const emailCheckResult = await db.query(emailCheckQuery, [email, userId]);
    
    if (emailCheckResult.rows.length > 0) {
      return NextResponse.json({ 
        error: "Email is already taken by another user" 
      }, { status: 400 });
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    updateFields.push(`name = $${valueIndex++}`);
    values.push(name);

    updateFields.push(`email = $${valueIndex++}`);
    values.push(email);

    if (role) {
      updateFields.push(`role = $${valueIndex++}`);
      values.push(role);
    }

    if (year) {
      updateFields.push(`year = $${valueIndex++}`);
      values.push(year);
    }

    if (branch) {
      updateFields.push(`branch = $${valueIndex++}`);
      values.push(branch);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, name, email, role, updated_at
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: "Internal server error while updating user" 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify user authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Ensure user is a super admin (only super admins can delete users)
    if (userRole !== 'super_admin') {
      return NextResponse.json({ 
        error: "Access denied. Only super admin users can delete users." 
      }, { status: 403 });
    }

    const { userId } = params;

    // Prevent self-deletion
    if (user.id === userId) {
      return NextResponse.json({ 
        error: "You cannot delete your own account" 
      }, { status: 400 });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Remove user from club memberships
      await db.query('DELETE FROM club_members WHERE user_id = $1', [userId]);
      
      // Remove user from committee memberships
      await db.query('DELETE FROM committee_members WHERE user_id = $1', [userId]);
      
      // Remove user from sessions
      await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      
      // Delete the user
      const deleteResult = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING email',
        [userId]
      );

      if (deleteResult.rows.length === 0) {
        throw new Error('User not found');
      }

      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `User ${deleteResult.rows[0].email} deleted successfully`
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error while deleting user" 
    }, { status: 500 });
  }
}