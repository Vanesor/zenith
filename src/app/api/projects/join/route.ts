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
      SELECT id, name, project_key, access_password, creator_id
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

    // Add user as project member
    const addMemberQuery = `
      INSERT INTO project_members (project_id, user_id, role, status, joined_at)
      VALUES ($1, $2, 'member', 'active', NOW())
      RETURNING id
    `;
    await db.query(addMemberQuery, [project.id, userId]);

    // Log the activity
    const activityQuery = `
      INSERT INTO project_activities (project_id, user_id, action, description, created_at)
      VALUES ($1, $2, 'member_joined', 'User joined the project using project key and access password', NOW())
    `;
    await db.query(activityQuery, [project.id, userId]);

    return NextResponse.json({
      message: 'Successfully joined project',
      project: {
        id: project.id,
        name: project.name
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
