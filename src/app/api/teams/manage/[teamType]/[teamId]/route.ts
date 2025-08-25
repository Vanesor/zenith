// Enhanced Team Management API
// app/api/teams/manage/[teamType]/[teamId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { TeamPermissionManager } from '@/lib/teamPermissions';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Get user email from session/token (implement based on your auth system)
async function getUserEmail(request: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  // Example: Extract from JWT token, session, etc.
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  // Placeholder - replace with actual auth logic
  return 'user@example.com';
}

// GET: Get team management data with permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const userEmail = await getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamType, teamId } = await params;

    if (!['committee', 'club'].includes(teamType)) {
      return NextResponse.json(
        { error: 'Invalid team type' },
        { status: 400 }
      );
    }

    // Get user permissions and team info
    const userInfo = await TeamPermissionManager.getUserTeamInfo(
      userEmail,
      teamType as 'committee' | 'club',
      teamId
    );

    if (!userInfo.isMember) {
      return NextResponse.json(
        { error: 'Access denied: Not a team member' },
        { status: 403 }
      );
    }

    // Get team data based on type
    let teamData;
    
    if (teamType === 'club') {
      const result = await query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.logo_url,
          c.banner_url,
          c.website_url,
          c.social_links,
          c.status,
          json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'avatar_url', u.avatar_url,
              'role', cm.role,
              'academic_year', cm.academic_year,
              'is_current_term', cm.is_current_term,
              'join_date', cm.created_at
            ) ORDER BY 
              cm.academic_year DESC,
              CASE cm.role
                WHEN 'coordinator' THEN 1
                WHEN 'co_coordinator' THEN 2
                WHEN 'secretary' THEN 3
                WHEN 'treasurer' THEN 4
                WHEN 'member' THEN 5
                ELSE 6
              END
          ) as members
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE c.id = $1
        GROUP BY c.id
      `, [teamId]);
      
      teamData = result.rows[0];
    } else {
      const result = await query(`
        SELECT 
          com.id,
          com.name,
          com.description,
          com.logo_url,
          com.banner_url,
          com.website_url,
          com.status,
          json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'avatar_url', u.avatar_url,
              'role', cr.name,
              'role_permissions', json_build_object(
                'can_create_projects', cr.can_create_projects,
                'can_manage_events', cr.can_manage_events,
                'can_approve_content', cr.can_approve_content,
                'is_privileged', cr.is_privileged
              ),
              'academic_year', cm.academic_year,
              'is_current_term', cm.is_current_term,
              'status', cm.status,
              'join_date', cm.created_at
            ) ORDER BY 
              cm.academic_year DESC,
              cr.hierarchy_level ASC
          ) as members
        FROM committees com
        LEFT JOIN committee_members cm ON com.id = cm.committee_id AND cm.status = 'active'
        LEFT JOIN users u ON cm.user_id = u.id
        LEFT JOIN committee_roles cr ON cm.role_id = cr.id
        WHERE com.id = $1
        GROUP BY com.id
      `, [teamId]);
      
      teamData = result.rows[0];
    }

    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get available academic years
    const yearsResult = await query(`
      SELECT DISTINCT academic_year
      FROM ${teamType === 'club' ? 'club_members' : 'committee_members'}
      WHERE ${teamType === 'club' ? 'club_id' : 'committee_id'} = $1
      ORDER BY academic_year DESC
    `, [teamId]);

    const availableYears = yearsResult.rows.map(row => row.academic_year);

    return NextResponse.json({
      team: teamData,
      userPermissions: userInfo,
      availableYears,
      teamType
    });

  } catch (error) {
    console.error('Error fetching team management data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add new member to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const userEmail = await getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamType, teamId } = await params;
    
    // Check if user has privileged permissions
    const hasPermission = await TeamPermissionManager.hasPrivilegedPermissions(
      userEmail,
      teamType as 'committee' | 'club',
      teamId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberEmail, role, academicYear } = body;

    if (!memberEmail || !role || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields: memberEmail, role, academicYear' },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [memberEmail]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    if (teamType === 'club') {
      // Check if user is already a member for this year
      const existingResult = await query(
        'SELECT id FROM club_members WHERE club_id = $1 AND user_id = $2 AND academic_year = $3',
        [teamId, userId, academicYear]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'User is already a member for this academic year' },
          { status: 400 }
        );
      }

      // Add member
      await query(`
        INSERT INTO club_members (club_id, user_id, role, academic_year, is_current_term)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        teamId, 
        userId, 
        role, 
        academicYear,
        academicYear === new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString()
      ]);

    } else {
      // For committees, we need role_id
      const roleResult = await query(
        'SELECT id FROM committee_roles WHERE name = $1 AND committee_id = $2',
        [role, teamId]
      );

      if (roleResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid role for this committee' },
          { status: 400 }
        );
      }

      const roleId = roleResult.rows[0].id;

      // Check if user is already a member for this year
      const existingResult = await query(
        'SELECT id FROM committee_members WHERE committee_id = $1 AND user_id = $2 AND academic_year = $3 AND status = $4',
        [teamId, userId, academicYear, 'active']
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'User is already an active member for this academic year' },
          { status: 400 }
        );
      }

      // Add member
      await query(`
        INSERT INTO committee_members (committee_id, user_id, role_id, academic_year, is_current_term, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
      `, [
        teamId, 
        userId, 
        roleId, 
        academicYear,
        academicYear === new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString()
      ]);
    }

    return NextResponse.json({
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update member role/status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const userEmail = await getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamType, teamId } = await params;
    
    // Check if user has privileged permissions
    const hasPermission = await TeamPermissionManager.hasPrivilegedPermissions(
      userEmail,
      teamType as 'committee' | 'club',
      teamId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberEmail, newRole, academicYear, status } = body;

    if (!memberEmail || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields: memberEmail, academicYear' },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [memberEmail]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    if (teamType === 'club') {
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;

      if (newRole) {
        updateFields.push(`role = $${valueIndex++}`);
        updateValues.push(newRole);
      }

      if (updateFields.length > 0) {
        updateValues.push(teamId, userId, academicYear);
        await query(`
          UPDATE club_members 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE club_id = $${valueIndex} AND user_id = $${valueIndex + 1} AND academic_year = $${valueIndex + 2}
        `, updateValues);
      }

    } else {
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;

      if (newRole) {
        const roleResult = await query(
          'SELECT id FROM committee_roles WHERE name = $1 AND committee_id = $2',
          [newRole, teamId]
        );

        if (roleResult.rows.length === 0) {
          return NextResponse.json(
            { error: 'Invalid role for this committee' },
            { status: 400 }
          );
        }

        updateFields.push(`role_id = $${valueIndex++}`);
        updateValues.push(roleResult.rows[0].id);
      }

      if (status) {
        updateFields.push(`status = $${valueIndex++}`);
        updateValues.push(status);
      }

      if (updateFields.length > 0) {
        updateValues.push(teamId, userId, academicYear);
        await query(`
          UPDATE committee_members 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE committee_id = $${valueIndex} AND user_id = $${valueIndex + 1} AND academic_year = $${valueIndex + 2}
        `, updateValues);
      }
    }

    return NextResponse.json({
      message: 'Member updated successfully'
    });

  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const userEmail = await getUserEmail(request);
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { teamType, teamId } = await params;
    
    // Check if user has privileged permissions
    const hasPermission = await TeamPermissionManager.hasPrivilegedPermissions(
      userEmail,
      teamType as 'committee' | 'club',
      teamId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('memberEmail');
    const academicYear = searchParams.get('academicYear');

    if (!memberEmail || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required parameters: memberEmail, academicYear' },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [memberEmail]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    if (teamType === 'club') {
      await query(
        'DELETE FROM club_members WHERE club_id = $1 AND user_id = $2 AND academic_year = $3',
        [teamId, userId, academicYear]
      );
    } else {
      // For committees, mark as inactive instead of deleting
      await query(`
        UPDATE committee_members 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE committee_id = $1 AND user_id = $2 AND academic_year = $3
      `, [teamId, userId, academicYear]);
    }

    return NextResponse.json({
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
