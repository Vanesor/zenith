'use server';

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { db } from "@/lib/database";
import { RoleHierarchy } from "@/lib/roleHierarchy";

/**
 * API to get committee data for the committee management dashboard
 */
export async function GET(request: NextRequest) {
  console.log('=== COMMITTEE MANAGEMENT API START ===');
  
  try {
    // Verify authentication
    console.log('1. Starting auth verification...');
    const authResult = await verifyAuth(request);
    console.log('2. Auth result:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      userId: authResult.user?.id,
      userEmail: authResult.user?.email
    });
    
    // Check the Authorization header for debugging
    const authHeader = request.headers.get('Authorization');
    console.log('3. Authorization header present:', !!authHeader);
    if (authHeader) {
      console.log('   Token format check:', authHeader.startsWith('Bearer '));
    }
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ AUTH FAILED: Unauthorized');
      return NextResponse.json(
        { error: "Unauthorized", message: "You need to be logged in to access this resource" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ AUTH PASSED: User authenticated');

    // Check if user has proper permissions (zenith committee or admin)
    const userRole = user.role?.toLowerCase() || '';
    const hasAccessRights = RoleHierarchy.isPrivilegedRole(userRole) || 
                           userRole === 'admin' || 
                           userRole === 'super_admin';

    if (!hasAccessRights) {
      console.log('❌ PERMISSION DENIED: User does not have committee management rights');
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    console.log('4. Fetching committee data...');

    // Fetch all committees
    const committeesResult = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description,
        'committee' as type,
        STRING_AGG(DISTINCT cm.academic_year, ', ') as academic_years,
        COUNT(DISTINCT cm.id) as member_count,
        c.created_at,
        c.updated_at
      FROM 
        committees c
      LEFT JOIN 
        committee_members cm ON c.id = cm.committee_id AND cm.is_current_term = true
      GROUP BY 
        c.id, c.name, c.description, c.created_at, c.updated_at
      ORDER BY 
        c.name ASC
    `);
    const committees = committeesResult.rows;

    // Fetch committee members with user details
    const committeeMembersResult = await db.query(`
      SELECT 
        cm.id,
        cm.user_id,
        cm.committee_id,
        u.name,
        u.email,
        cr.name as role,
        cr.hierarchy,
        cm.status as is_active,
        cm.joined_at,
        cm.academic_year,
        u.avatar,
        u.profile_image_url
      FROM 
        committee_members cm
      JOIN 
        users u ON cm.user_id = u.id
      JOIN
        committee_roles cr ON cm.role_id = cr.id
      WHERE
        cm.is_current_term = true
      ORDER BY 
        cr.hierarchy ASC, u.name ASC
    `);
    const committeeMembers = committeeMembersResult.rows;

    // Get statistics
    const stats = {
      total_committees: committees.length,
      total_members: committeeMembers.length,
      active_members: committeeMembers.filter((m: any) => m.is_active === 'active').length,
      committees_by_type: committees.reduce((acc: Record<string, number>, committee: any) => {
        const type = committee.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    console.log('5. Data fetched successfully');
    console.log('   - Committees:', committees.length);
    console.log('   - Committee Members:', committeeMembers.length);

    // Return the data
    console.log('=== COMMITTEE MANAGEMENT API SUCCESS ===');
    return NextResponse.json({
      committees,
      members: committeeMembers,
      stats
    });

  } catch (error) {
    console.error("💥 FATAL ERROR in committee-management API:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch committee data" },
      { status: 500 }
    );
  }
}

/**
 * Update user information (name and email)
 */
export async function PUT(request: NextRequest) {
  console.log('=== USER UPDATE API START ===');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUser = authResult.user;
    
    // Check if user has admin permissions
    const userRole = adminUser.role?.toLowerCase() || '';
    const hasAdminRights = RoleHierarchy.isPrivilegedRole(userRole) || 
                          userRole === 'admin' || 
                          userRole === 'super_admin';

    if (!hasAdminRights) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userId, name, email, academicYear, role } = body;
    
    if (!userId || (!name && !email && !academicYear && !role)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Updating user ${userId} with name: ${name}, email: ${email}, academicYear: ${academicYear}, role: ${role}`);

    // Check if email is unique if it's being updated
    if (email) {
      console.log(`Checking email uniqueness for ${email}`);
      
      const emailCheckResult = await db.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email, userId]
      );
      
      console.log('Email check result:', {
        hasResult: !!emailCheckResult,
        rowCount: emailCheckResult?.rowCount || 0
      });
      
      if (emailCheckResult && emailCheckResult.rowCount && emailCheckResult.rowCount > 0) {
        console.log('❌ Email already in use by another user');
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 400 }
        );
      }
      
      console.log('✅ Email is unique, proceeding with update');
    }

    // Prepare update query for user data (name, email)
    let userUpdateQuery = 'UPDATE users SET ';
    const userQueryParams = [];
    const userUpdateFields = [];
    
    if (name) {
      userQueryParams.push(name);
      userUpdateFields.push(`name = $${userQueryParams.length}`);
    }
    
    if (email) {
      userQueryParams.push(email);
      userUpdateFields.push(`email = $${userQueryParams.length}`);
    }
    
    // Add timestamp for updated_at
    userUpdateFields.push(`updated_at = NOW()`);
    
    // Only run user update if we have fields to update
    let userData = null;
    if (userUpdateFields.length > 1) { // > 1 because we always have updated_at
      // Add WHERE clause
      userQueryParams.push(userId);
      userUpdateQuery += userUpdateFields.join(', ') + ` WHERE id = $${userQueryParams.length} RETURNING id, name, email`;

      // Execute update for user data
      const userResult = await db.query(userUpdateQuery, userQueryParams);
      
      if (userResult.rowCount === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      userData = userResult.rows[0];
      console.log('✅ User data updated successfully:', userData);
    }
    
    // Update committee member data if academic year or role is provided
    let memberData = null;
    if (academicYear || role) {
      // First, find the committee member record
      const memberQuery = `
        SELECT cm.id, cr.id as role_id, cr.name as role_name
        FROM committee_members cm
        JOIN committee_roles cr ON cm.role_id = cr.id
        WHERE cm.user_id = $1
      `;
      
      const memberResult = await db.query(memberQuery, [userId]);
      
      if (memberResult.rowCount === 0) {
        return NextResponse.json(
          { error: "Committee member record not found" },
          { status: 404 }
        );
      }
      
      const memberId = memberResult.rows[0].id;
      
      // If role is provided, find the role_id
      let roleId = memberResult.rows[0].role_id;
      if (role && role !== memberResult.rows[0].role_name) {
        const roleQuery = `
          SELECT id FROM committee_roles WHERE name = $1
        `;
        const roleResult = await db.query(roleQuery, [role]);
        
        if (roleResult.rowCount === 0) {
          return NextResponse.json(
            { error: "Role not found" },
            { status: 400 }
          );
        }
        
        roleId = roleResult.rows[0].id;
      }
      
      // Update the committee member record
      const memberUpdateQuery = `
        UPDATE committee_members SET
          ${academicYear ? 'academic_year = $1,' : ''}
          ${role ? 'role_id = $2,' : ''}
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, academic_year, role_id
      `;
      
      const memberUpdateParams = [];
      if (academicYear) {
        memberUpdateParams.push(academicYear);
      }
      if (role) {
        memberUpdateParams.push(roleId);
      }
      memberUpdateParams.push(memberId);
      
      const memberUpdateResult = await db.query(memberUpdateQuery, memberUpdateParams);
      
      if (memberUpdateResult.rowCount === 0) {
        return NextResponse.json(
          { error: "Failed to update committee member record" },
          { status: 500 }
        );
      }
      
      memberData = memberUpdateResult.rows[0];
      console.log('✅ Committee member data updated successfully:', memberData);
    }
    
    return NextResponse.json({
      message: "User information updated successfully",
      updates: {
        user: userData,
        member: memberData
      }
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}