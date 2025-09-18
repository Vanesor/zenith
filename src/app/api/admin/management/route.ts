import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';
import { RoleHierarchy, ClubManagementAccess } from '@/lib/roleHierarchy';

/**
 * Admin Management API
 * Allows admin/super_admin to manage committee members and user roles
 * Hierarchy: super_admin > admin > zenith committee > coordinators > members
 */

// GET - Get all committees and members for admin management
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const accessLevel = await RoleHierarchy.getClubManagementAccess(authResult.user.id);
    
    if (!['admin', 'super_admin'].includes(accessLevel.level)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const includeCommittees = searchParams.get('include') === 'committees';
    const includeUsers = searchParams.get('include') === 'users' || searchParams.get('include') === 'all';

    const result: any = {
      permissions: {
        canManageCommittees: true,
        canManageUserRoles: accessLevel.level === 'super_admin',
        canCreateAdmins: accessLevel.level === 'super_admin',
        accessLevel: accessLevel.level
      }
    };

    // Get committees and their members
    if (includeCommittees || !includeUsers) {
      const committeesQuery = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.created_at,
          COUNT(DISTINCT cm.id) as member_count,
          COUNT(DISTINCT cr.id) as role_count
        FROM committees c
        LEFT JOIN committee_members cm ON c.id = cm.committee_id AND cm.is_current_term = true
        LEFT JOIN committee_roles cr ON c.id = cr.committee_id
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.name
      `;

      const committeesResult = await db.query(committeesQuery);

      // Get committee members with their roles
      const membersQuery = `
        SELECT 
          cm.id as membership_id,
          cm.committee_id,
          cm.user_id,
          cm.status,
          cm.joined_at,
          cm.is_current_term,
          cm.academic_year,
          u.name as user_name,
          u.email as user_email,
          u.role as user_base_role,
          cr.name as committee_role,
          cr.hierarchy,
          cr.is_privileged,
          cr.permissions
        FROM committee_members cm
        JOIN users u ON cm.user_id = u.id
        JOIN committee_roles cr ON cm.role_id = cr.id
        ORDER BY cr.hierarchy ASC, u.name
      `;

      const membersResult = await db.query(membersQuery);

      // Group members by committee
      const committeesWithMembers = committeesResult.rows.map(committee => {
        const members = membersResult.rows
          .filter(member => member.committee_id === committee.id)
          .map(member => ({
            membershipId: member.membership_id,
            userId: member.user_id,
            userName: member.user_name,
            userEmail: member.user_email,
            userBaseRole: member.user_base_role,
            committeeRole: member.committee_role,
            hierarchy: member.hierarchy,
            isPrivileged: member.is_privileged,
            permissions: member.permissions || [],
            status: member.status,
            joinedAt: member.joined_at,
            isCurrentTerm: member.is_current_term,
            academicYear: member.academic_year
          }));

        return {
          id: committee.id,
          name: committee.name,
          description: committee.description,
          memberCount: parseInt(committee.member_count) || 0,
          roleCount: parseInt(committee.role_count) || 0,
          createdAt: committee.created_at,
          members
        };
      });

      result.committees = committeesWithMembers;
    }

    // Get all users with their roles for user management
    if (includeUsers) {
      const usersQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role as base_role,
          u.created_at,
          u.last_activity,
          COUNT(DISTINCT cm.id) as committee_memberships,
          COUNT(DISTINCT clm.id) as club_memberships
        FROM users u
        LEFT JOIN committee_members cm ON u.id = cm.user_id AND cm.is_current_term = true
        LEFT JOIN club_members clm ON u.id = clm.user_id AND clm.is_current_term = true
        GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.last_activity
        ORDER BY u.role DESC, u.name
      `;

      const usersResult = await db.query(usersQuery);

      result.users = usersResult.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        baseRole: user.base_role,
        committeeMemberships: parseInt(user.committee_memberships) || 0,
        clubMemberships: parseInt(user.club_memberships) || 0,
        createdAt: user.created_at,
        lastActivity: user.last_activity
      }));
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching admin management data:", error);
    return NextResponse.json(
      { error: "Failed to fetch management data" },
      { status: 500 }
    );
  }
}

// POST - Admin operations for committee and user management
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const accessLevel = await RoleHierarchy.getClubManagementAccess(authResult.user.id);
    
    if (!['admin', 'super_admin'].includes(accessLevel.level)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'add_committee_member':
        return await handleAddCommitteeMember(data, authResult.user.id, accessLevel.level);
      
      case 'remove_committee_member':
        return await handleRemoveCommitteeMember(data, authResult.user.id, accessLevel.level);
      
      case 'change_committee_role':
        return await handleChangeCommitteeRole(data, authResult.user.id, accessLevel.level);
      
      case 'change_user_base_role':
        return await handleChangeUserBaseRole(data, authResult.user.id, accessLevel.level);
      
      case 'create_committee_role':
        return await handleCreateCommitteeRole(data, authResult.user.id, accessLevel.level);
      
      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Error in admin operation:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
}

// Add user to committee with specific role
async function handleAddCommitteeMember(
  data: {
    userId: string;
    committeeId: string;
    roleId: string;
    academicYear?: string;
  },
  adminId: string,
  accessLevel: string
) {
  const { userId, committeeId, roleId, academicYear = '2024-2025' } = data;

  try {
    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if role exists and get its details
    const roleResult = await db.query(
      'SELECT id, name, is_privileged FROM committee_roles WHERE id = $1 AND committee_id = $2',
      [roleId, committeeId]
    );

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Committee role not found" },
        { status: 404 }
      );
    }

    // Add committee member
    await db.query(`
      INSERT INTO committee_members (
        committee_id, role_id, user_id, status, academic_year, is_current_term
      )
      VALUES ($1, $2, $3, 'active', $4, true)
      ON CONFLICT (committee_id, user_id, academic_year) 
      DO UPDATE SET 
        role_id = $2,
        status = 'active',
        is_current_term = true,
        updated_at = CURRENT_TIMESTAMP
    `, [committeeId, roleId, userId, academicYear]);

    return NextResponse.json({
      message: "Successfully added user to committee"
    });

  } catch (error) {
    console.error("Error adding committee member:", error);
    return NextResponse.json(
      { error: "Failed to add committee member" },
      { status: 500 }
    );
  }
}

// Remove user from committee
async function handleRemoveCommitteeMember(
  data: {
    membershipId: string;
  },
  adminId: string,
  accessLevel: string
) {
  const { membershipId } = data;

  try {
    const result = await db.query(`
      UPDATE committee_members 
      SET 
        status = 'inactive',
        is_current_term = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [membershipId]);

    if ((result.rowCount || 0) === 0) {
      return NextResponse.json(
        { error: "Committee membership not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Successfully removed user from committee"
    });

  } catch (error) {
    console.error("Error removing committee member:", error);
    return NextResponse.json(
      { error: "Failed to remove committee member" },
      { status: 500 }
    );
  }
}

// Change committee member's role
async function handleChangeCommitteeRole(
  data: {
    membershipId: string;
    newRoleId: string;
  },
  adminId: string,
  accessLevel: string
) {
  const { membershipId, newRoleId } = data;

  try {
    const result = await db.query(`
      UPDATE committee_members 
      SET 
        role_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newRoleId, membershipId]);

    if ((result.rowCount || 0) === 0) {
      return NextResponse.json(
        { error: "Committee membership not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Successfully changed committee role"
    });

  } catch (error) {
    console.error("Error changing committee role:", error);
    return NextResponse.json(
      { error: "Failed to change committee role" },
      { status: 500 }
    );
  }
}

// Change user's base role (only super_admin can do this)
async function handleChangeUserBaseRole(
  data: {
    userId: string;
    newRole: 'student' | 'admin' | 'super_admin';
  },
  adminId: string,
  accessLevel: string
) {
  const { userId, newRole } = data;

  // Only super_admin can change user base roles
  if (accessLevel !== 'super_admin') {
    return NextResponse.json(
      { error: "Insufficient permissions. Super admin access required." },
      { status: 403 }
    );
  }

  // Prevent changing own role to prevent lockout
  if (userId === adminId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  try {
    const result = await db.query(`
      UPDATE users 
      SET 
        role = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newRole, userId]);

    if ((result.rowCount || 0) === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Successfully changed user role to ${newRole}`
    });

  } catch (error) {
    console.error("Error changing user base role:", error);
    return NextResponse.json(
      { error: "Failed to change user role" },
      { status: 500 }
    );
  }
}

// Create new committee role
async function handleCreateCommitteeRole(
  data: {
    committeeId: string;
    name: string;
    description?: string;
    hierarchy: number;
    permissions: string[];
    isPrivileged: boolean;
  },
  adminId: string,
  accessLevel: string
) {
  const { committeeId, name, description, hierarchy, permissions, isPrivileged } = data;

  try {
    const result = await db.query(`
      INSERT INTO committee_roles (
        committee_id, name, description, hierarchy, permissions, is_privileged
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [committeeId, name, description, hierarchy, permissions, isPrivileged]);

    return NextResponse.json({
      message: "Successfully created committee role",
      roleId: result.rows[0].id
    });

  } catch (error) {
    console.error("Error creating committee role:", error);
    return NextResponse.json(
      { error: "Failed to create committee role" },
      { status: 500 }
    );
  }
}