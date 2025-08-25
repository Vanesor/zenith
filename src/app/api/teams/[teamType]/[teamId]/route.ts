import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  academic_year: string;
  is_current_term: boolean;
  is_privileged: boolean;
  join_date: string;
}

// GET: Fetch team members and data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const { teamType, teamId } = await params;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('year') || null;
    
    if (!['committee', 'club'].includes(teamType)) {
      return NextResponse.json(
        { error: 'Invalid team type' },
        { status: 400 }
      );
    }

    let teamData;
    let availableYears: string[] = [];
    
    if (teamType === 'club') {
      // Get club data with members
      const clubQuery = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.logo_url,
          c.banner_image_url as banner_url,
          c.member_count,
          json_agg(
            CASE WHEN cm.id IS NOT NULL THEN
              json_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email,
                'avatar', u.avatar,
                'role', cm.role,
                'academic_year', cm.academic_year,
                'is_current_term', cm.is_current_term,
                'is_privileged', CASE WHEN cm.role IN ('coordinator', 'co_coordinator') THEN true ELSE false END,
                'join_date', cm.created_at
              )
            ELSE NULL END
          ) FILTER (WHERE cm.id IS NOT NULL) as members
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      
      const result = await query(clubQuery, [teamId]);
      teamData = result.rows[0];

      // Get available years
      const yearsResult = await query(`
        SELECT DISTINCT academic_year
        FROM club_members
        WHERE club_id = $1
        ORDER BY academic_year DESC
      `, [teamId]);
      
      availableYears = yearsResult.rows.map(row => row.academic_year);

    } else {
      // Get committee data with members
      const committeeQuery = `
        SELECT 
          com.id,
          com.name,
          com.description,
          json_agg(
            CASE WHEN cm.id IS NOT NULL THEN
              json_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email,
                'avatar', u.avatar,
                'role', cr.name,
                'academic_year', cm.academic_year,
                'is_current_term', cm.is_current_term,
                'is_privileged', cr.is_privileged,
                'role_permissions', json_build_object(
                  'can_create_projects', cr.can_create_projects,
                  'can_manage_events', cr.can_manage_events,
                  'can_approve_content', cr.can_approve_content,
                  'is_privileged', cr.is_privileged
                ),
                'join_date', cm.created_at
              )
            ELSE NULL END
          ) FILTER (WHERE cm.id IS NOT NULL) as members
        FROM committees com
        LEFT JOIN committee_members cm ON com.id = cm.committee_id AND cm.status = 'active'
        LEFT JOIN users u ON cm.user_id = u.id
        LEFT JOIN committee_roles cr ON cm.role_id = cr.id
        WHERE com.id = $1
        GROUP BY com.id
      `;
      
      const result = await query(committeeQuery, [teamId]);
      teamData = result.rows[0];

      // Get available years
      const yearsResult = await query(`
        SELECT DISTINCT academic_year
        FROM committee_members
        WHERE committee_id = $1
        ORDER BY academic_year DESC
      `, [teamId]);
      
      availableYears = yearsResult.rows.map(row => row.academic_year);
    }

    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Filter members by academic year if specified
    let members = teamData.members || [];
    if (academicYear && academicYear !== 'all') {
      members = members.filter((member: any) => member.academic_year === academicYear);
    }

    return NextResponse.json({
      team: {
        id: teamData.id,
        name: teamData.name,
        description: teamData.description,
        type: teamType
      },
      members: members,
      availableYears: availableYears.length > 0 ? availableYears : ['2024-2025']
    });

  } catch (error) {
    console.error('Team showcase API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Add a new team member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const { teamType, teamId } = await params;
    
    // Check authentication and authorization
    const isAuth = await verifyAuth(request as NextRequest);
    if (!isAuth.success || !isAuth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['committee', 'club'].includes(teamType)) {
      return NextResponse.json(
        { error: 'Invalid team type' },
        { status: 400 }
      );
    }

    const { userId, roleId, academicYear } = await request.json();

    // Validate required fields
    if (!userId || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let insertResult;

    if (teamType === 'club') {
      const insertClubMemberQuery = `
        INSERT INTO club_members (club_id, user_id, role, academic_year, is_current_term, status, created_at)
        VALUES ($1, $2, $3, $4, 
          CASE WHEN $4 = '2024-2025' THEN true ELSE false END,
          'active', NOW())
        ON CONFLICT (club_id, user_id, academic_year) DO UPDATE SET
          role = EXCLUDED.role,
          status = 'active',
          is_current_term = EXCLUDED.is_current_term,
          updated_at = NOW()
        RETURNING *
      `;
      
      insertResult = await query(insertClubMemberQuery, [
        teamId, 
        userId, 
        roleId || 'member', 
        academicYear
      ]);
    } else {
      const insertCommitteeMemberQuery = `
        INSERT INTO committee_members (committee_id, user_id, role_id, academic_year, is_current_term, status, created_at)
        VALUES ($1, $2, $3, $4,
          CASE WHEN $4 = '2024-2025' THEN true ELSE false END,
          'active', NOW())
        ON CONFLICT (committee_id, user_id, academic_year) DO UPDATE SET
          role_id = EXCLUDED.role_id,
          status = 'active',
          is_current_term = EXCLUDED.is_current_term,
          updated_at = NOW()
        RETURNING *
      `;
      
      insertResult = await query(insertCommitteeMemberQuery, [
        teamId,
        userId,
        roleId,
        academicYear
      ]);
    }

    return NextResponse.json({
      success: true,
      member: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

// PUT: Update a team member's role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const { teamType, teamId } = await params;
    
    const isAuth = await verifyAuth(request as NextRequest);
    if (!isAuth.success || !isAuth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['committee', 'club'].includes(teamType)) {
      return NextResponse.json(
        { error: 'Invalid team type' },
        { status: 400 }
      );
    }

    const { userId, roleId, academicYear } = await request.json();

    if (!userId || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let updateResult;

    if (teamType === 'club') {
      const updateClubMemberQuery = `
        UPDATE club_members 
        SET role = $1, updated_at = NOW()
        WHERE club_id = $2 AND user_id = $3 AND academic_year = $4
        RETURNING *
      `;
      
      updateResult = await query(updateClubMemberQuery, [
        roleId || 'member',
        teamId,
        userId,
        academicYear
      ]);
    } else {
      const updateCommitteeMemberQuery = `
        UPDATE committee_members 
        SET role_id = $1, updated_at = NOW()
        WHERE committee_id = $2 AND user_id = $3 AND academic_year = $4
        RETURNING *
      `;
      
      updateResult = await query(updateCommitteeMemberQuery, [
        roleId,
        teamId,
        userId,
        academicYear
      ]);
    }

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      member: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamType: string; teamId: string }> }
) {
  try {
    const { teamType, teamId } = await params;
    
    const isAuth = await verifyAuth(request as NextRequest);
    if (!isAuth.success || !isAuth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['committee', 'club'].includes(teamType)) {
      return NextResponse.json(
        { error: 'Invalid team type' },
        { status: 400 }
      );
    }

    const { userId, academicYear } = await request.json();

    if (!userId || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let deleteResult;

    if (teamType === 'club') {
      const deleteClubMemberQuery = `
        UPDATE club_members 
        SET status = 'inactive', updated_at = NOW()
        WHERE club_id = $1 AND user_id = $2 AND academic_year = $3
        RETURNING *
      `;
      
      deleteResult = await query(deleteClubMemberQuery, [
        teamId,
        userId,
        academicYear
      ]);
    } else {
      const deleteCommitteeMemberQuery = `
        UPDATE committee_members 
        SET status = 'inactive', updated_at = NOW()
        WHERE committee_id = $1 AND user_id = $2 AND academic_year = $3
        RETURNING *
      `;
      
      deleteResult = await query(deleteCommitteeMemberQuery, [
        teamId,
        userId,
        academicYear
      ]);
    }

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
