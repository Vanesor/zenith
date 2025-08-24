import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    
    const { projectKey, accessPassword } = await request.json();

    if (!projectKey || !accessPassword) {
      return NextResponse.json({ error: 'Project key and access password are required' }, { status: 400 });
    }

    // Find project by both project key and access password
    const projectQuery = `
      SELECT id, name, project_key, access_password, created_by
      FROM projects 
      WHERE project_key = $1 AND access_password = $2 AND status != 'archived'
    `;
    const projectResult = await db.query(projectQuery, [projectKey, accessPassword]);

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid project key or access password' }, { status: 404 });
    }

    const project = projectResult.rows[0];

    // Check if user is already a member
    const memberQuery = `
      SELECT id FROM project_members 
      WHERE project_id = $1 AND user_id = $2
    `;
    const memberResult = await db.query(memberQuery, [project.id, userId]);

    if (memberResult.rows.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this project' }, { status: 400 });
    }

    // Get user information
    const userQuery = `
      SELECT id, name, email, club_id
      FROM users
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    // Add user as project member
    const addMemberQuery = `
      INSERT INTO project_members (project_id, user_id, role, status, joined_at, permissions)
      VALUES ($1, $2, 'member', 'joined', NOW(), '{"can_delete_tasks": false, "can_manage_team": false, "can_view_share_keys": true}')
      RETURNING id
    `;
    await db.query(addMemberQuery, [project.id, userId]);

    // Log the activity in the audit_logs table
    const projectClubQuery = `
      SELECT c.name as club_name, c.id as club_id
      FROM projects p
      JOIN clubs c ON p.club_id = c.id
      WHERE p.id = $1
    `;
    const projectClubResult = await db.query(projectClubQuery, [project.id]);
    const projectClub = projectClubResult.rows[0]?.club_name || 'Unknown club';
    const projectClubId = projectClubResult.rows[0]?.club_id;
    
    // Get user's club name
    const userClubQuery = `
      SELECT c.name as club_name
      FROM clubs c
      WHERE c.id = $1
    `;
    const userClubResult = await db.query(userClubQuery, [user.club_id]);
    const userClub = userClubResult.rows[0]?.club_name || 'Unknown club';
    
    // Determine if it's a cross-club join
    const isCrossClubJoin = user.club_id !== projectClubId;
    const details = {
      userName: user.name,
      userClub: userClub,
      projectName: project.name,
      projectClub: projectClub,
      isCrossClubJoin: isCrossClubJoin
    };
    
    // Log to audit_logs table
    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await db.query(auditQuery, [
      userId, 
      'project_member_joined', 
      'project', 
      project.id, 
      JSON.stringify(details)
    ]);

    // Prepare response with cross-club information if applicable
    const responseMessage = isCrossClubJoin 
      ? `Successfully joined project "${project.name}" from ${projectClub} (cross-club collaboration)`
      : `Successfully joined project "${project.name}"`;
    
    return NextResponse.json({
      message: responseMessage,
      project: {
        id: project.id,
        name: project.name,
        projectClub: projectClub
      },
      isCrossClubJoin: isCrossClubJoin,
      userClub: userClub
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
