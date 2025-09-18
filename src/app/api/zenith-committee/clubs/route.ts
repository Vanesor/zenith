import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';
import { RoleHierarchy, ClubManagementAccess } from '@/lib/roleHierarchy';

/**
 * Zenith Committee Management API
 * Allows Zenith committee members to manage all club members across different clubs
 * Hierarchy: admin/super_admin > zenith committee > coordinators/co_coordinators > members
 */

// GET - Get all clubs with member counts and management capabilities for Zenith committee
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has Zenith committee access or higher
    const accessLevel = await RoleHierarchy.getClubManagementAccess(authResult.user.id);
    
    if (accessLevel.level === 'none' || accessLevel.level === 'club') {
      return NextResponse.json(
        { error: "Insufficient permissions. Zenith committee access required." },
        { status: 403 }
      );
    }

    // Get all clubs with member counts and recent activity
    const clubsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.logo_url,
        c.member_count,
        c.created_at,
        COUNT(DISTINCT cm.id) as current_members,
        COUNT(DISTINCT CASE WHEN cm.role = 'coordinator' THEN cm.id END) as coordinators,
        COUNT(DISTINCT CASE WHEN cm.role = 'co_coordinator' THEN cm.id END) as co_coordinators
      FROM clubs c
      LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.is_current_term = true
      GROUP BY c.id, c.name, c.description, c.logo_url, c.member_count, c.created_at
      ORDER BY c.name
    `;

    const clubsResult = await db.query(clubsQuery);

    // Get recent member activities for all clubs
    const recentActivitiesQuery = `
      SELECT 
        cm.club_id,
        COUNT(*) as recent_joins
      FROM club_members cm
      WHERE cm.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY cm.club_id
    `;

    const activitiesResult = await db.query(recentActivitiesQuery);
    const activitiesMap = new Map(
      activitiesResult.rows.map(row => [row.club_id, parseInt(row.recent_joins)])
    );

    const clubs = clubsResult.rows.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      logoUrl: club.logo_url,
      memberCount: parseInt(club.member_count) || 0,
      currentMembers: parseInt(club.current_members) || 0,
      coordinators: parseInt(club.coordinators) || 0,
      coCoordinators: parseInt(club.co_coordinators) || 0,
      recentJoins: activitiesMap.get(club.id) || 0,
      createdAt: club.created_at
    }));

    return NextResponse.json({
      clubs,
      permissions: {
        canManageAllClubs: true,
        canPromoteToCoordinator: accessLevel.level !== 'zenith', // Admin+ can promote to coordinator
        canDemoteCoordinators: accessLevel.level !== 'zenith', // Admin+ can demote coordinators
        accessLevel: accessLevel.level
      }
    });

  } catch (error) {
    console.error("Error fetching clubs for Zenith committee:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs data" },
      { status: 500 }
    );
  }
}

// POST - Bulk member operations across clubs (Zenith committee specific)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has Zenith committee access or higher
    const accessLevel = await RoleHierarchy.getClubManagementAccess(authResult.user.id);
    
    if (accessLevel.level === 'none' || accessLevel.level === 'club') {
      return NextResponse.json(
        { error: "Insufficient permissions. Zenith committee access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'bulk_transfer':
        return await handleBulkTransfer(data, authResult.user.id, accessLevel.level);
      
      case 'bulk_role_change':
        return await handleBulkRoleChange(data, authResult.user.id, accessLevel.level);
      
      case 'cross_club_promotion':
        return await handleCrossClubPromotion(data, authResult.user.id, accessLevel.level);
      
      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Error in Zenith committee club operation:", error);
    return NextResponse.json(
      { error: "Failed to perform operation" },
      { status: 500 }
    );
  }
}

// Handle bulk transfer of members between clubs
async function handleBulkTransfer(
  data: {
    userIds: string[];
    fromClubId: string;
    toClubId: string;
    maintainRole?: boolean;
  },
  managerId: string,
  accessLevel: string
) {
  const { userIds, fromClubId, toClubId, maintainRole = false } = data;

  if (!userIds || userIds.length === 0) {
    return NextResponse.json(
      { error: "No users specified for transfer" },
      { status: 400 }
    );
  }

  try {
    await db.query('BEGIN');

    for (const userId of userIds) {
      // Get current membership details
      const currentMemberQuery = `
        SELECT role, hierarchy 
        FROM club_members 
        WHERE user_id = $1 AND club_id = $2 AND is_current_term = true
      `;
      const currentMember = await db.query(currentMemberQuery, [userId, fromClubId]);

      if (currentMember.rows.length === 0) {
        continue; // Skip if user is not a member of the source club
      }

      const currentRole = currentMember.rows[0].role;
      const newRole = maintainRole ? currentRole : 'member';

      // Remove from old club
      await db.query(`
        UPDATE club_members 
        SET is_current_term = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND club_id = $2 AND is_current_term = true
      `, [userId, fromClubId]);

      // Add to new club
      await db.query(`
        INSERT INTO club_members (user_id, club_id, role, hierarchy, is_current_term)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (user_id, club_id) 
        DO UPDATE SET 
          role = $3,
          hierarchy = $4,
          is_current_term = true,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, toClubId, newRole, newRole === 'coordinator' ? 1 : newRole === 'co_coordinator' ? 2 : 5]);
    }

    // Update member counts
    await db.query(`
      UPDATE clubs 
      SET member_count = (
        SELECT COUNT(*) FROM club_members 
        WHERE club_id = clubs.id AND is_current_term = true
      )
      WHERE id IN ($1, $2)
    `, [fromClubId, toClubId]);

    await db.query('COMMIT');

    return NextResponse.json({
      message: `Successfully transferred ${userIds.length} members from one club to another`,
      transferredCount: userIds.length
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error in bulk transfer:", error);
    return NextResponse.json(
      { error: "Failed to transfer members" },
      { status: 500 }
    );
  }
}

// Handle bulk role changes across multiple clubs
async function handleBulkRoleChange(
  data: {
    operations: Array<{
      userId: string;
      clubId: string;
      newRole: string;
    }>;
  },
  managerId: string,
  accessLevel: string
) {
  const { operations } = data;

  if (!operations || operations.length === 0) {
    return NextResponse.json(
      { error: "No operations specified" },
      { status: 400 }
    );
  }

  try {
    await db.query('BEGIN');

    const results = [];

    for (const op of operations) {
      const { userId, clubId, newRole } = op;

      // Validate role
      if (!['member', 'co_coordinator', 'coordinator'].includes(newRole)) {
        results.push({
          userId,
          clubId,
          success: false,
          error: 'Invalid role specified'
        });
        continue;
      }

      // For coordinator role changes, only admin+ can do it
      if (newRole === 'coordinator' && accessLevel === 'zenith') {
        results.push({
          userId,
          clubId,
          success: false,
          error: 'Insufficient permissions to assign coordinator role'
        });
        continue;
      }

      // Update the role
      const updateResult = await db.query(`
        UPDATE club_members 
        SET 
          role = $1, 
          hierarchy = $2, 
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3 AND club_id = $4 AND is_current_term = true
      `, [
        newRole, 
        newRole === 'coordinator' ? 1 : newRole === 'co_coordinator' ? 2 : 5,
        userId, 
        clubId
      ]);

      results.push({
        userId,
        clubId,
        success: (updateResult.rowCount || 0) > 0,
        error: (updateResult.rowCount || 0) === 0 ? 'User not found in club' : null
      });
    }

    await db.query('COMMIT');

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      message: `Processed ${operations.length} role changes, ${successCount} successful`,
      results,
      successCount
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error in bulk role change:", error);
    return NextResponse.json(
      { error: "Failed to change roles" },
      { status: 500 }
    );
  }
}

// Handle cross-club promotions (promoting members to coordinators in different clubs)
async function handleCrossClubPromotion(
  data: {
    userId: string;
    targetClubId: string;
    promotionType: 'coordinator' | 'co_coordinator';
  },
  managerId: string,
  accessLevel: string
) {
  const { userId, targetClubId, promotionType } = data;

  // Only admin+ can do cross-club coordinator promotions
  if (promotionType === 'coordinator' && accessLevel === 'zenith') {
    return NextResponse.json(
      { error: "Insufficient permissions for coordinator promotion" },
      { status: 403 }
    );
  }

  try {
    await db.query('BEGIN');

    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Add user to club with the specified role
    await db.query(`
      INSERT INTO club_members (user_id, club_id, role, hierarchy, is_current_term)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (user_id, club_id) 
      DO UPDATE SET 
        role = $3,
        hierarchy = $4,
        is_current_term = true,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId, 
      targetClubId, 
      promotionType, 
      promotionType === 'coordinator' ? 1 : 2
    ]);

    // Update club member count
    await db.query(`
      UPDATE clubs 
      SET member_count = (
        SELECT COUNT(*) FROM club_members 
        WHERE club_id = $1 AND is_current_term = true
      )
      WHERE id = $1
    `, [targetClubId]);

    await db.query('COMMIT');

    return NextResponse.json({
      message: `Successfully promoted user to ${promotionType} in the target club`
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error in cross-club promotion:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}