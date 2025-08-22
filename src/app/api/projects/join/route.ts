import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    
    const { accessCode } = await request.json();

    if (!accessCode) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    // Find project by access password
    const projectQuery = `
      SELECT id, name, access_password, creator_id
      FROM projects 
      WHERE access_password = $1 AND status != 'archived'
    `;
    const projectResult = await db.query(projectQuery, [accessCode]);

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 404 });
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
      VALUES ($1, $2, 'member_joined', 'User joined the project using access code', NOW())
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
    console.error('Error joining project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
