import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

interface Props {
  params: Promise<{ clubId: string }>;
}

// Helper function to check if user has club management permissions
async function hasClubManagementPermissions(requestingUserId: string, targetClubId: string, role: string): Promise<boolean> {
  if (!role) return false;
  
  const userRole = role.toLowerCase();
  
  // Super admin access
  if (userRole === 'super_admin') return true;
  
  // System admin access
  if (userRole === 'admin') return true;
  
  // Zenith committee access
  const zenithRoles = [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ];
  
  if (zenithRoles.includes(userRole)) return true;
  
  // Club coordinator/co_coordinator access - check if they're coordinator of the specific club
  if (userRole === 'coordinator' || userRole === 'co_coordinator') {
    try {
      const clubCheckQuery = `
        SELECT cm.club_id 
        FROM club_members cm 
        WHERE cm.user_id = $1 AND cm.is_current_term = true
        AND cm.role IN ('coordinator', 'co_coordinator')
        AND cm.club_id = $2
      `;
      const result = await db.query(clubCheckQuery, [requestingUserId, targetClubId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking club management permissions:', error);
      return false;
    }
  }
  
  return false;
}

// GET /api/clubs/[clubId]/members - Get club members
export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const { clubId } = await params;

    // Get club members from club_members table
    const membersQuery = `
      SELECT 
        cm.id as membership_id,
        cm.user_id,
        cm.role,
        cm.joined_at,
        cm.is_current_term,
        cm.hierarchy,
        u.name,
        u.email,
        u.avatar,
        u.profile_image_url
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1 AND cm.is_current_term = true
      ORDER BY 
        CASE cm.role 
          WHEN 'coordinator' THEN 1
          WHEN 'co_coordinator' THEN 2
          WHEN 'member' THEN 3
          ELSE 4
        END,
        cm.joined_at DESC
    `;

    const result = await db.query(membersQuery, [clubId]);
    const members = result.rows;

    return NextResponse.json({ 
      members,
      total: members.length,
      success: true 
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch club members" },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[clubId]/members - Add member to club
export async function POST(request: NextRequest, { params }: Props) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const { clubId } = await params;
    const { userEmail, role = 'member' } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await hasClubManagementPermissions(
      authResult.user.id, 
      clubId, 
      authResult.user.role
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to manage this club's members" },
        { status: 403 }
      );
    }

    // Find user by email
    const userQuery = `SELECT id, name, email FROM users WHERE email = $1`;
    const userResult = await db.query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }
    
    const targetUser = userResult.rows[0];
    
    // Check if user is already a member of this club
    const existingMemberQuery = `
      SELECT id FROM club_members 
      WHERE user_id = $1 AND club_id = $2 AND is_current_term = true
    `;
    const existingResult = await db.query(existingMemberQuery, [targetUser.id, clubId]);
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this club" },
        { status: 400 }
      );
    }
    
    // Add user to club
    const addMemberQuery = `
      INSERT INTO club_members (user_id, club_id, role, joined_at, is_current_term)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
      RETURNING id
    `;
    
    await db.query(addMemberQuery, [targetUser.id, clubId, role]);
    
    // Update club member count
    const updateCountQuery = `
      UPDATE clubs 
      SET member_count = (
        SELECT COUNT(*) FROM club_members 
        WHERE club_id = $1 AND is_current_term = true
      )
      WHERE id = $1
    `;
    await db.query(updateCountQuery, [clubId]);

    return NextResponse.json({ 
      message: `${targetUser.name} has been added to the club as ${role}`,
      success: true
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/clubs/[clubId]/members - Update member role or tag
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { clubId } = await params;
    const { userId, newRole, newTag } = await request.json();
    
    if (!userId || (!newRole && !newTag)) {
      return NextResponse.json(
        { error: "User ID and either new role or new tag are required" },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check permissions
    const hasPermission = await hasClubManagementPermissions(
      authResult.user.id, 
      clubId, 
      authResult.user.role
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to manage this club's members" },
        { status: 403 }
      );
    }
    
    // Get current user info to determine what updates we need to make
    const userQuery = `
      SELECT u.id, u.role as user_role, cm.role as club_role 
      FROM users u
      LEFT JOIN club_members cm ON u.id = cm.user_id AND cm.club_id = $1 AND cm.is_current_term = true
      WHERE u.id = $2
    `;
    
    const userResult = await db.query(userQuery, [clubId, userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const userInfo = userResult.rows[0];
    let updatedRole = newRole || userInfo.club_role;
    let updatedTag = newTag;
    let updates = [];
    
    // Validate role if provided
    if (newRole) {
      const validRoles = ['coordinator', 'co_coordinator', 'member'];
      if (!validRoles.includes(newRole)) {
        return NextResponse.json(
          { error: "Invalid role. Must be one of: coordinator, co_coordinator, member" },
          { status: 400 }
        );
      }
      
      // Update club_members table with new role
      const updateClubRoleQuery = `
        UPDATE club_members 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND club_id = $3 AND is_current_term = true
        RETURNING id
      `;
      
      const result = await db.query(updateClubRoleQuery, [newRole, userId, clubId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Member not found in this club" },
          { status: 404 }
        );
      }
      
      updates.push(`club role to "${newRole}"`);
    }
    
    // If updating tag (student tag like "student media")
    if (newTag) {
      // Validate tag format (should start with "student")
      if (!newTag.startsWith('student')) {
        return NextResponse.json(
          { error: "Invalid tag format. Tags should start with 'student'" },
          { status: 400 }
        );
      }
      
      // Update user role in users table with new tag
      const updateUserRoleQuery = `
        UPDATE users
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;
      
      const userRoleResult = await db.query(updateUserRoleQuery, [newTag, userId]);
      
      if (userRoleResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Failed to update user tag" },
          { status: 500 }
        );
      }
      
      updates.push(`user tag to "${newTag}"`);
      
      // Check if user is also in committee_members and update if needed
      const committeeQuery = `
        SELECT id FROM committee_members WHERE user_id = $1 AND is_current_term = true
      `;
      
      const committeeResult = await db.query(committeeQuery, [userId]);
      
      if (committeeResult.rows.length > 0) {
        // User is in committee_members table, update their role there too
        const updateCommitteeQuery = `
          UPDATE committee_members
          SET updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1 AND is_current_term = true
        `;
        
        await db.query(updateCommitteeQuery, [userId]);
      }
    }
    
    return NextResponse.json({
      message: `Updated ${updates.join(" and ")}`,
      success: true
    });
    
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[clubId]/members - Remove member from club
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { clubId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check permissions
    const hasPermission = await hasClubManagementPermissions(
      authResult.user.id, 
      clubId, 
      authResult.user.role
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to manage this club's members" },
        { status: 403 }
      );
    }
    
    // Prevent self-removal
    if (authResult.user.id === userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the club" },
        { status: 400 }
      );
    }
    
    // Remove member from club
    const removeMemberQuery = `
      UPDATE club_members 
      SET is_current_term = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND club_id = $2 AND is_current_term = true
      RETURNING id
    `;
    
    const result = await db.query(removeMemberQuery, [userId, clubId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Member not found in this club" },
        { status: 404 }
      );
    }
    
    // Update club member count
    const updateCountQuery = `
      UPDATE clubs 
      SET member_count = (
        SELECT COUNT(*) FROM club_members 
        WHERE club_id = $1 AND is_current_term = true
      )
      WHERE id = $1
    `;
    await db.query(updateCountQuery, [clubId]);
    
    return NextResponse.json({
      message: "Member removed from club",
      success: true
    });
    
  } catch (error) {
    console.error("Error removing club member:", error);
    return NextResponse.json(
      { error: "Failed to remove club member" },
      { status: 500 }
    );
  }
}
